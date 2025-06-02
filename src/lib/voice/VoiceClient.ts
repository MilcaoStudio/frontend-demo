import EventEmitter from "eventemitter3";

import {
  WSEventType,
  type VoiceError,
  type VoiceUser,
  Role,
  type Transports,
  type Trickle,
  type UserJoinEventData,
  type UserLeftEventData,
} from "./Voice";
import Signaling from "./Signaling";
import { LocalStream, makeRemote, type RemoteStream } from "./Stream";
import { voiceState } from "./VoiceState";

interface VoiceEvents {
  ready: () => void;
  error: (error: Error) => void;
  close: (error?: VoiceError) => void;
  userJoined: (userId: string) => void;
  userLeft: (userId: string) => void;
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
          // this will trigger onNegotiationNeeded
          this.pc.restartIce();
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

  constructor() {
    super();
    this.config = {
      codec: "vp8",
      iceServers: [
        {
          urls: [
            "stun:stun.l.google.com:19302",
            "stun:stun2.l.google.com:19302",
          ],
        },
      ],
    };
    this.signaling = new Signaling();
    this.participants = new Map();
    this.isDeaf = false;

    this.signaling.on(
      "data",
      (data) => {
        switch (data.type) {
          case WSEventType.Accept: {
            console.log("Accept", data);
            data.user_ids.forEach((id: string) => {
              this.participants.set(id, { streams: [] });
            });
            this.emit("ready");
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
          case WSEventType.Trickle: {
            this.trickle(data);
            break;
          }
          case WSEventType.UserJoin: {
            this.participants.set(data.id, data);
            console.debug(data);
            //state.settings.sounds.playSound("call_join");
            // TODO: connect to user tracks (offer?)
            this.emit("userJoined", data.id);
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
  }

  addTrack(track: MediaStreamTrack, stream: RemoteStream) {
    voiceState.tracks.set(track.id, stream);
    console.debug(
      "Added track",
      track.id,
      track.kind,
      track.muted ? "muted" : "active"
    );
  }

  get supported() {
    return RTCPeerConnection != undefined;
  }

  async connect(address: string, token: string) {
    await this.signaling.connect(address);
    await this.signaling.authenticate(token);
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
      this.renegotiate(false);
  }

  handleDataChannelMessage(msg: { type: string; data: any }) {
    const { type, data } = msg;
    switch (type) {
      case "UserJoin":
        this.onUserJoin(data);
        this.emit("userJoined", data.user_id);
        break;
      case "UserLeft":
        this.onUserLeave(data);
        this.emit("userLeft", data.user_id);
        break;
      default:
        console.debug("Unknown message type", msg.type);
    }
  }

  async join(roomId: string, userId: string) {
    this.roomId = roomId;
    this.userId = userId;
    this.transports = {
      [Role.pub]: new Transport(Role.pub, this.signaling, this.config),
      [Role.sub]: new Transport(Role.sub, this.signaling, this.config),
    };

    this.transports[Role.sub].pc.ontrack = (ev: RTCTrackEvent) => {
      console.debug("Subscriber listening to track", ev.track.id);
      const stream = ev.streams[0];
      const remote = makeRemote(stream, this.transports![Role.sub]);
      this.addTrack(ev.track, remote);
    };

    this.transports![Role.sub].pc.ondatachannel = (ev: RTCDataChannelEvent) => {
      console.debug("Subscriber data channel", ev.channel.label);
      if (ev.channel.label == API_CHANNEL) {
        this.transports![Role.sub].api = ev.channel;
        this.transports![Role.pub].api = ev.channel;
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

    const offer = await this.transports[Role.pub].pc.createOffer();
    await this.transports[Role.pub].pc.setLocalDescription(offer);
    // Awaits for join signal response
    const answer = await this.signaling.join(roomId, offer);
    await this.handleAnswer(answer.description);
    this.participants.set(userId, {streams: []});
  }

  leave() {
    if (!this.signaling.connected()) return;
    this.signaling.leave();
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
    const streams = event.user_tracks
      .map((track_id) => {
        const s = voiceState.tracks.get(track_id);
        if (!s) {
          console.warn("Stream for %s not found", track_id);
        }
        return s;
      })
      .filter((stream) => stream != undefined);
    this.participants.set(userId, {
      streams,
    });
    console.debug("UserJoin", userId, streams);
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

  /**
   * Restarts publisher negotiation
   */
  async renegotiate(iceRestart: boolean) {
    if (!this.transports) {
      throw ERR_INVALID_STATE;
    }

    let offer: RTCSessionDescriptionInit,
      answer: { type: "Answer"; description: RTCSessionDescriptionInit };
    try {
      offer = await this.transports[Role.pub].pc.createOffer({ iceRestart });
      await this.transports[Role.pub].pc.setLocalDescription(offer);
      answer = await this.signaling.offer(offer);
      await this.transports[Role.pub].pc.setRemoteDescription(
        answer.description
      );
    } catch (err) {
      console.error(err);
    }
  }

  stopProduce(stream: LocalStream) {
    const user = this.userId ? this.participants.get(this.userId): undefined;
    if (user) {
      const userId = this.userId!;
      const streams = user.streams.filter((s) => s.id != stream.id);
      this.participants.set(userId, {...user, streams});
      console.debug(this.participants);
    }
  }

  publishTrack(atStream: LocalStream) {
    if (!this.transports) {
      throw new ReferenceError(
        "Client transports are undefined. Use join method."
      );
    }
    atStream.publish(this.transports[Role.pub]);
  }

  restartIce() {
    this.renegotiate(true);
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
}
