import EventEmitter from "eventemitter3";

import {
  WSEventType,
  type VoiceError,
  Role,
  type Transports,
  type Trickle,
  type UserJoinedData,
  type UserLeftData,
  type RoomInfo,
  type VoiceActivityData,
  type AuthenticationResult,
  type TrackAddedData,
} from "./Voice";
import Signaling from "./Signaling";
import { LocalStream, makeRemote, type RemoteStream } from "./Stream";
//import { voiceState } from "./VoiceState";
import { VoiceUser, type VoiceUserData } from "./VoiceUser.svelte";
import { LocalVoiceUser } from "./LocalVoiceUser.svelte";

interface VoiceEvents {
  ready: () => void;
  error: (error: Error) => void;
  close: (error?: VoiceError) => void;
  userLeft: (userId: string) => void;
  roomInfo: () => void;
  voiceActivityChanged: () => void;
  trackAdded: () => void;
  userUpdated: (user: VoiceUser) => void;
}

const API_CHANNEL = "System";
const ERR_INVALID_STATE = ReferenceError("Voice Client is in an invalid state");
export class Transport {
  api?: RTCDataChannel;
  pc: RTCPeerConnection;
  candidates: RTCIceCandidateInit[];

  constructor(
    role: Role,
    public signaling: Signaling,
    config: RTCConfiguration
  ) {
    this.pc = new RTCPeerConnection(config);
    this.candidates = [];

    if (role == Role.pub) {
      this.pc.createDataChannel(API_CHANNEL);
    }

    this.pc.onicecandidate = ({ candidate }) => {
      if (candidate) {
        this.signaling.trickle({ target: role, candidate });
      }
    };

    this.pc.oniceconnectionstatechange = async () => {
      // iOS iceConnectionState can go straight to "failed" without emitting "disconnected"
      if (
        this.pc.iceConnectionState == "disconnected" ||
        this.pc.iceConnectionState == "failed"
      ) {
        console.warn(
          `[${
            role ? "sub" : "pub"
          }] peer connection disconnected or failed... Restarting ICE`
        );
        if (this.pc.restartIce) {
          this.pc.restartIce();
        }

        if (role == Role.sub) {
          console.warn("Should restart peer connection. Leave room and try again.");
        }
      }
    };
  }
}

export interface VoiceClientConfiguration extends RTCConfiguration {
  codec: "vp8" | "vp9" | "h264";
}

export default class VoiceClient extends EventEmitter<VoiceEvents> {
  private transports?: Transports<Role, Transport>;
  private config: VoiceClientConfiguration;

  isDeaf?: boolean;

  userId?: string;
  roomId?: string;
  participants: Map<string, VoiceUser>;
  signaling: Signaling;
  tracks: Map<string, {streamId: string; user: VoiceUser }>;
  pendingTracks: Map<string, { track: MediaStreamTrack; stream: RemoteStream }>;

  constructor() {
    super();
    this.config = {
      codec: "vp8",
    };
    this.signaling = new Signaling();
    this.participants = new Map();
    this.tracks = new Map();
    this.pendingTracks = new Map();
    this.isDeaf = false;

    this.signaling.on(
      "data",
      (data) => {
        switch (data.type) {
          case WSEventType.Accept: {
            this.handleAccept(data);
            break;
          }
          case WSEventType.Answer: {
            if (data.description) {
              this.handleAnswer(data.description);
            }
            break;
          }
          case WSEventType.Offer: {
            if (data.description) {
              this.negotiate(data.description);
            }
            break;
          }
          case WSEventType.RoomInfo: {
            this.handleRoomInfo(data);
            break;
          }
          case WSEventType.Trickle: {
            this.trickle(data);
            break;
          }
          case WSEventType.UserLeft: {
            this.participants.delete(data.id);
            this.emit("userLeft", data.id);

            //if (this.recvTransport) this.stopConsume(data.id);
            break;
          }
          case WSEventType.UserStartProduce: {
            const user = this.participants.get(data.id);
            if (user === undefined) return;
            switch (data.type) {
              case "audio":
                user.audio = true;
                break;
              default:
                throw new Error(`Invalid produce type ${data.type}`);
            }
            break;
          }
          case WSEventType.UserStopProduce: {
            const user = this.participants.get(data.id);
            if (!user) return;
            switch (data.type) {
              case "audio":
                user.audio = false;
                break;
              default:
                throw new Error(`Invalid produce type ${data.type}`);
            }
            break;
          }
          case WSEventType.ServerError: {
            this.emit("error", new Error(data.error));
          }
          default:
            console.debug(data);
        }
      },
      this
    );

    this.signaling.on(
      "error",
      () => {
        this.emit("error", new Error("Signaling error"));
      },
      this
    );

    this.signaling.on(
      "close",
      (error: { code: any; reason: string }) => {
        this.signaling.disconnect();
      },
      this
    );

    this.signaling.on("negotiate", (role) => {
      console.debug("Negotiate %s not implemented", role);
    });
  }

  addParticipant(participant: VoiceUser) {
    this.participants.set(participant.id, participant);
    this.emit("userUpdated", participant);
  }

  handleAccept(data: AuthenticationResult) {
    if (data.ice_servers) {
      this.config.iceServers = data.ice_servers;
    } else {
      this.config.iceServers = [
        {
          urls: [
            "stun:stun.l.google.com:19302",
            "stun:stun2.l.google.com:19302",
          ],
        },
      ];
    }
    console.debug("Config loaded", this.config);
    this.emit("ready");
  }

  handleRoomInfo(data: RoomInfo) {
    console.debug("RoomInfo: ", JSON.stringify(data));
    const room = data.room;

    Object.entries(room.users).forEach(([userId, streams]) => {
      if (this.userId == userId) {
        console.debug("Skip this user (local user publishes tracks after this event)");
        return;
      }
      const user = new VoiceUser({ id: userId});
      for (const streamInfo of streams) {
        for (const trackId of streamInfo.tracks) {
          const pending = this.pendingTracks.get(trackId);
          if (pending) {
              const { track, stream } = pending;
              this.linkTrack(track, stream, user);
              this.pendingTracks.delete(trackId);
          }
          this.tracks.set(trackId, { user, streamId: streamInfo.id });
        }
      }
      this.addParticipant(user);
    });
    this.emit("roomInfo");
  }

  /**
   * Links track and stream into user. If stream exists, adds the track.
   */
  linkTrack(track: MediaStreamTrack, stream: RemoteStream, user: VoiceUser) {
    user.addTrack(track, stream);

    this.emit("userUpdated", user);
    this.emit("trackAdded");
  }

  addTrack(track: MediaStreamTrack, stream: RemoteStream) {
    const existing = this.tracks.get(track.id);
    if (existing) {
      const { user } = existing;
      this.linkTrack(track, stream, user);
      console.debug(
        "Linked track",
        track.id,
        track.kind,
        track.muted ? "muted" : "active",
        "stream",
        stream.id,
        "to",
        user.id,
      );
    } else {
      this.pendingTracks.set(track.id, { track, stream });
      console.debug(
        "Added pending track",
        track.id,
        track.kind,
        track.muted ? "muted" : "active",
        "stream",
        stream.id
      );
    }
  }

  get supported() {
    return RTCPeerConnection != undefined;
  }

  async connect(address: string, token: string) {
    await this.signaling.connect(address);
    const result = await this.signaling.authenticate(token);
    this.handleAccept(result);
  }

  /**
   * Sets the publisher remote description and adds the candidates
   */
  async handleAnswer(description: RTCSessionDescriptionInit) {
    if (!this.transports) {
      return;
    }
    await this.transports[Role.pub].pc.setRemoteDescription(description);
    this.transports[Role.pub].candidates.forEach((c) =>
      this.transports![Role.pub].pc.addIceCandidate(c)
    );
    this.transports[Role.pub].pc.onnegotiationneeded = () =>
      this.renegotiatePublisher(false);
  }

  handleDataChannelMessage(msg: { type: string; data: any }) {
    const { type, data } = msg;
    switch (type) {
      case "UserJoined":
        this.onUserJoin(data);
        break;
      case "UserLeft":
        this.onUserLeave(data);
        break;
      case "VoiceActivity":
        this.onVoiceActivity(data);
        break;
      case "TrackAdded":
        this.onTrackAdded(data);
        break;
      default:
        console.debug("Unknown message type", msg.type);
    }
  }

  async join(roomId: string, userId: string, stream?: LocalStream) {
    this.roomId = roomId;
    this.userId = userId;
    this.transports = {
      [Role.pub]: new Transport(Role.pub, this.signaling, this.config),
      [Role.sub]: new Transport(Role.sub, this.signaling, this.config),
    };

    const subscriber = this.transports[Role.sub];
    const publisher = this.transports[Role.pub];

    subscriber.pc.ontrack = (ev: RTCTrackEvent) => {
      console.groupCollapsed("Subscriber ontrack");
      console.debug("Subscriber listening to track", ev.track.id);
      //const stream = ev.streams[0];
      for (const stream of ev.streams) {
        const remote = makeRemote(stream, subscriber);
        this.addTrack(ev.track, remote);
      }
      console.groupEnd();
    };

    subscriber.pc.ondatachannel = (ev: RTCDataChannelEvent) => {
      console.debug("Subscribed to data channel", ev.channel.label);
      if (ev.channel.label == API_CHANNEL) {
        subscriber.api = ev.channel;
        publisher.api = ev.channel;
        ev.channel.onmessage = (e) => {
          console.groupCollapsed("Subscriber received a message");
          try {
            this.handleDataChannelMessage(JSON.parse(e.data));
          } catch (err) {
            console.error(err);
          } finally {
            console.groupEnd();
          }
        };
        return;
      } else {
        ev.channel.onmessage = (e) => {
          console.debug("Message intercepted:", e.data);
          console.warn("No message handler");
        };
      }
    };

    if (stream) {
      this.publishTrack(stream);
    } else {
      this.addParticipant(new VoiceUser({ id: userId }));
    }

    const offer = await publisher.pc.createOffer();
    await publisher.pc.setLocalDescription(offer);
    // Awaits for join signal response
    const answer = await this.signaling.join(roomId, offer);
    await this.handleAnswer(answer.description);
  }

  leave() {
    if (!this.signaling.connected() || !this.roomId) return;
    this.signaling.leave();

    // Disconnects devices
    this.participants.forEach((u) => u.clearStreams());
    this.participants.clear();

    this.roomId = undefined;
    if (this.transports) {
      Object.values(this.transports).forEach((t) => t.pc.close());
      this.transports = undefined;
    }
  }

  disconnect(error?: VoiceError, ignoreDisconnected?: boolean) {
    if (!this.signaling.connected() && !ignoreDisconnected) return;
    this.leave();
    this.userId = undefined;
    
    this.emit("close", error);
  }

  /**
   * Sets offer as the subscriber remote description, adds the candidates and sends the answer
   */
  async negotiate(description: RTCSessionDescriptionInit) {
    if (!this.transports) {
      throw ERR_INVALID_STATE;
    }
    let answer: RTCSessionDescriptionInit;
    try {
      await this.transports[Role.sub].pc.setRemoteDescription(description);
      this.transports[Role.sub].candidates.forEach((c) =>
        this.transports![Role.sub].pc.addIceCandidate(c)
      );
      this.transports[Role.sub].candidates = [];
      answer = await this.transports[Role.sub].pc.createAnswer();
      await this.transports[Role.sub].pc.setLocalDescription(answer);
      this.signaling.answer(answer);
    } catch (err) {
      console.error(err);
    }
  }

  onUserJoin(event: UserJoinedData) {
    console.debug(event);
    const roomId = event.room_id;
    if (this.roomId != roomId) {
      console.warn(
        "UserLeave event received for different room",
        roomId,
        this.roomId
      );
    }
    const id = event.uid;

    // TODO: add user capabilities in event (audio/video/screencast)
    const user = new VoiceUser({ id })
    this.addParticipant(user);
  }

  onUserLeave(event: UserLeftData) {
    const userId = event.user_id;
    const roomId = event.room_id;
    if (this.roomId != roomId) {
      console.warn(
        "UserLeave event received for different room",
        roomId,
        this.roomId
      );
    }
    this.participants.delete(userId);
    this.emit("userLeft", userId);
    console.debug("%s removed from participants", userId);
  }

  onVoiceActivity(data: VoiceActivityData) {
    console.debug("VoiceActivity", data);
    const streamIds = new Set(data.stream_ids);
    this.participants.forEach((u) => {
      u.active = Array.from(u.streams.values()).some(s => streamIds.has(s.id));
    });
  }

  onTrackAdded(data: TrackAddedData) {
    console.debug("TrackAdded", data);
    const uid = data.uid;

    if (this.userId == uid) {
      console.debug("Skip this user");
      return;
    }
    const user = this.participants.get(uid);
    if (!user) {
      console.warn("onTrackAdded > User %s not found");
      return;
    }
    const trackId = data.track;
    const pending = this.pendingTracks.get(trackId);
    if (pending) {
      const { track, stream } = pending;
      this.linkTrack(track, stream, user);
      this.pendingTracks.delete(trackId);
    }
    this.tracks.set(trackId, { user, streamId: data.stream.id });
  }

  /**
   * Restarts publisher negotiation
   */
  async renegotiatePublisher(iceRestart: boolean) {
    if (!this.transports) {
      throw ERR_INVALID_STATE;
    }

    let offer: RTCSessionDescriptionInit,
      answer: { type: "Answer"; description: RTCSessionDescriptionInit };
    const pc = this.transports[Role.pub].pc;
    try {
      offer = await pc.createOffer({ iceRestart });
      await pc.setLocalDescription(offer);
      answer = await this.signaling.offer(offer);
      await pc.setRemoteDescription(answer.description);
    } catch (err) {
      console.error(err);
    }
  }

  /**
   * Restarts subscriber negotiation
   */
  async renegotiateSubscriber(iceRestart: boolean) {
    if (!this.transports) {
      throw ERR_INVALID_STATE;
    }

    let offer: RTCSessionDescriptionInit,
      answer: { type: "Answer"; description: RTCSessionDescriptionInit };
    const pc = this.transports[Role.sub].pc;
    try {
      offer = await pc.createOffer({ iceRestart });
      await pc.setLocalDescription(offer);
      answer = await this.signaling.offer(offer);
      await pc.setRemoteDescription(answer.description);
    } catch (err) {
      console.error(err);
    }
  }

  stopProduce(stream: LocalStream) {
    if (!this.userId) {
      throw ERR_INVALID_STATE;
    }

    const user = this.user;
    if (user) {
      user.streams.delete(stream.id);
    }
  }

  publishTrack(atStream: LocalStream, screencast = false) {
    if (!this.transports) {
      throw new ReferenceError(
        "Client transports are undefined. Use join method."
      );
    }

    if (!this.userId) {
      throw ERR_INVALID_STATE;
    }

    const stream = atStream;
    const updated = {
      audio: stream.getAudioTracks().length > 0,
      video: !screencast && stream.getVideoTracks().length > 0,
      screencast: screencast && stream.getVideoTracks().length > 0,
    };

    let user: LocalVoiceUser;
    if (this.participants.has(this.userId)) {
      user = this.updateParticipant(this.userId, updated) as LocalVoiceUser;
    } else {
      user = new LocalVoiceUser({ id: this.userId, ...updated });
    }

    if (screencast) {
      user.setScreencastStream(stream);
    } else {
      user.setDefaultStream(stream);
    }
    this.addParticipant(user);

    atStream.publish(this.transports[Role.pub]);
  }

  restartIce() {
    this.renegotiatePublisher(true);
  }

  async trickle({ candidate, target }: Trickle) {
    if (!this.transports) {
      throw ERR_INVALID_STATE;
    }
    if (this.transports[target].pc.remoteDescription) {
      this.transports[target].pc.addIceCandidate(candidate);
    } else {
      this.transports[target].candidates.push(candidate);
    }
  }

  updateParticipant(id: string, data: Partial<VoiceUserData>) {
    const user = this.participants.get(id);
    if (!user) {
      console.warn("User not found", id);
      return;
    }
    user.updateFromPartial(data);
    this.participants.set(id, user);
    this.emit("userUpdated", user);
    return user;
  }

  get user(): LocalVoiceUser {
    return this.userId ? (this.participants.get(this.userId) as LocalVoiceUser) : undefined;
  }
}
