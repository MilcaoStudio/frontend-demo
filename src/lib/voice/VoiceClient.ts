import EventEmitter from "eventemitter3";

import {
  WSEventType,
  type VoiceError,
  Role,
  type Transports,
  type Trickle,
  type UserJoinEventData,
  type UserLeftEventData,
  type RoomInfo,
  type VoiceActivityEventData,
  type AuthenticationResult,
} from "./Voice";
import Signaling from "./Signaling";
import { LocalStream, makeRemote, type RemoteStream } from "./Stream";
//import { voiceState } from "./VoiceState";
import { VoiceUser, type VoiceUserData } from "./VoiceUser.svelte";

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
          // 1. Restart ICE
          this.pc.restartIce();
          // 2. Send offer signal
          this.signaling.offer
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
  tracks: Map<string, { stream: RemoteStream; track: MediaStreamTrack }>;

  constructor() {
    super();
    this.config = {
      codec: "vp8",
    };
    this.signaling = new Signaling();
    this.participants = new Map();
    this.tracks = new Map();
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
        this.disconnect(
          {
            error: error.code,
            message: error.reason,
          },
          true
        );
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
    Object.entries(room.users).forEach(([userId, tracks]) => {
      if (userId == this.userId) {
        console.debug("Ignoring this user's tracks");
        return;
      }
      
      // At room info received, streams are not yet available
      const streams = tracks
        .map((trackId) => {
          const data = this.tracks.get(trackId);
          if (!data) {
            console.warn("Stream for %s not found", trackId);
            return;
          }
          return data.stream;
        })
        .filter((stream) => stream != undefined);
      this.addParticipant(new VoiceUser({ id: userId, tracks, streams }));
    });
    this.emit("roomInfo");
  }

  addTrack(track: MediaStreamTrack, stream: RemoteStream) {
    const user = this.participants.values().find((u) => u.tracks.has(track.id));
    if (user) {
      user.addStream(stream);
      this.emit("userUpdated", user);
    } else {
      console.warn("Found orphan track %s", track.id);
      this.tracks.set(track.id, { track, stream });
    }
    this.emit("trackAdded");
    console.debug(
      "Added track",
      track.id,
      track.kind,
      track.muted ? "muted" : "active",
      "stream",
      stream.id
    );
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
      case "UserJoin":
        this.onUserJoin(data);
        break;
      case "UserLeft":
        this.onUserLeave(data);
        this.emit("userLeft", data.user_id);
        break;
      case "VoiceActivity":
        this.onVoiceActivity(data);
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
      console.debug("Subscriber listening to track", ev.track.id);
      //const stream = ev.streams[0];
      for (const stream of ev.streams) {
        const remote = makeRemote(stream, subscriber);
        this.addTrack(ev.track, remote);
      }
    };

    subscriber.pc.ondatachannel = (ev: RTCDataChannelEvent) => {
      console.debug("Subscriber data channel", ev.channel.label);
      if (ev.channel.label == API_CHANNEL) {
        subscriber.api = ev.channel;
        publisher.api = ev.channel;
        ev.channel.onmessage = (e) => {
          try {
            this.handleDataChannelMessage(JSON.parse(e.data));
          } catch (err) {
            console.error(err);
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
    if (!this.signaling.connected()) return;
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
      console.debug("Local subscriber created answer", answer);
      await this.transports[Role.sub].pc.setLocalDescription(answer);
      this.signaling.answer(answer);
    } catch (err) {
      console.error(err);
    }
  }

  onUserJoin(event: UserJoinEventData) {
    const userId = event.user_id;
    const roomId = event.room_id;
    const tracks = event.user_tracks;
    if (userId == this.userId) {
      console.debug("Ignoring self join");
      return;
    }
    if (this.roomId != roomId) {
      console.warn(
        "UserJoin event received for different room",
        roomId,
        this.roomId
      );
    }
    
    const streams = tracks
      .map((track_id) => {
        const data = this.tracks.get(track_id);
        if (!data) {
          console.warn("Stream for %s not found", track_id);
        }
        return data.stream;
      })
      .filter((stream) => stream != undefined);
    // TODO: add user capabilities in event (audio/video/screencast)
    this.addParticipant(new VoiceUser({ id: userId, tracks, streams }));
    console.debug("UserJoin", userId, tracks, streams);
  }

  onUserLeave(event: UserLeftEventData) {
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
    console.debug("%s removed from participants", userId);
  }

  onVoiceActivity(data: VoiceActivityEventData) {
    console.debug("VoiceActivity", data);
    const streamIds = new Set(data.stream_ids);
    this.participants.forEach((u) => {
      u.active = u.streams.some((s) => streamIds.has(s.id));
      //this.emit("userUpdated", u);
    });
    console.debug("Participants updated", this.participants);
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

    const user = this.participants.get(this.userId);
    if (user) {
      const streams = user.streams.filter((s) => s.id != stream.id);
      this.updateParticipant(this.userId, { streams });
      console.debug(this.participants);
    }
  }

  publishTrack(atStream: LocalStream) {
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
      video: stream.getVideoTracks().length > 0,
      streams: [stream],
    };

    if (this.participants.has(this.userId)) {
      this.updateParticipant(this.userId, updated);
    } else {
      this.addParticipant(new VoiceUser({ id: this.userId, ...updated }));
    }

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
  }

  get user() {
    return this.userId ? this.participants.get(this.userId) : undefined;
  }
}
