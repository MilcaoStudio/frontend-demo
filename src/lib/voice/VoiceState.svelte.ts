import { fromStore, get, writable, type Writable } from "svelte/store";
import { LocalStream } from "./Stream";
import type VoiceClient from "./VoiceClient";
import { SvelteMap } from "svelte/reactivity";
import { env } from "$env/dynamic/public";
import { type VoiceUser } from "./VoiceUser.svelte";
import { StreamKind } from "./LocalVoiceUser.svelte";

export const participants: SvelteMap<string, VoiceUser> = new SvelteMap();
export enum VoiceStatus {
  // Default state, no connections
  UNLOADED = 0,
  // RTC is not available
  UNAVAILABLE = -2,
  // There was an error and connection fails
  ERRORED = -1,
  // Preparing voice client
  //LOADING = 3,
  // Connecting to signaling websocket
  CONNECTING = 1,
  // Connected to signaling websocket
  READY,
  // Connecting to server RTC peer
  RTC_CONNECTING,
  // Requesting user media
  RTC_REQUEST,
  // Connected to RTC peer
  CONNECTED,
}

class VoiceState {
  client?: VoiceClient;
  connecting?: boolean;

  audio: Writable<boolean> = writable(false);
  video: Writable<boolean> = writable(false);
  screencast: Writable<boolean> = writable(false);
  deaf: Writable<boolean> = writable(false);
  resolution: Writable<string> = writable("hd");
  error: Writable<string> = writable();
  status: Writable<VoiceStatus>;
  stream: Writable<LocalStream> = writable();
  streams: Map<string, LocalStream> = new SvelteMap();
  roomId: Writable<string | null>;
  //participants: SvelteMap<string, VoiceUser>;
  //tracks: Map<string, RemoteStream>;

  constructor() {
    this.roomId = writable(null);
    this.status = writable(VoiceStatus.UNLOADED);
    //this.participants = new SvelteMap();

    this.syncState = this.syncState.bind(this);
    this.connect = this.connect.bind(this);
    this.disconnect = this.disconnect.bind(this);

    //this.audio.subscribe(this.onAudioChange.bind(this));
    //this.video.subscribe(this.onVideoChange.bind(this));
  }

  // This takes information from the voice
  // client and applies it to the state here.
  syncState() {
    if (!this.client) return;
    this.roomId.set(this.client.roomId ?? null);
    this.client.participants.forEach((v, k) => {
      if (k == this.client.userId) {
        return;
      }
      const value = $state(v);
      //this.participants.set(k, value);
      participants.set(k, value);
    });
  }

  // This imports and constructs the voice client.
  async loadVoice() {
    const status = fromStore(this.status);
    if (status.current != VoiceStatus.UNLOADED) {
      console.warn("Voice already loaded");
      return;
    }
    //this.status.set(VoiceStatus.LOADING);

    try {
      const { default: VoiceClient } = await import("./VoiceClient");
      const client = new VoiceClient();

      // No need to sync state on ready
      //client.on("ready", this.syncState);
      //client.on("roomInfo", this.syncState);
      //client.on("userLeft", this.syncState);
      //client.on("voiceActivityChanged", this.syncState);
      client.on("userUpdated", this.updateParticipant);
      client.on("error", (err) => {
        if (get(this.status) > VoiceStatus.RTC_REQUEST) {
          this.leave();
        }
        console.error(err);
      });
      this.client = client;
    } catch (err) {
      this.status.set(VoiceStatus.UNLOADED);
      this.error.set("Failed to load voice library!");
      console.error("Failed to load voice library!", err);
    }
  }

  // Connect to websocket
  async connect(token: string) {
    if (!this.client?.supported) throw new Error("RTC is unavailable");

    this.connecting = true;
    this.status.set(VoiceStatus.CONNECTING);

    try {
      await this.client.connect(
        env.PUBLIC_VOSO_URL ?? "ws://localhost:4000",
        token
      );
      this.status.set(VoiceStatus.READY);
      this.syncState();
    } catch (err) {
      console.error(err);
      this.status.set(VoiceStatus.ERRORED);
    }
  }

  async join(roomId: string, userId: string) {
    this.status.set(VoiceStatus.RTC_CONNECTING);
    if (typeof userId != "string") throw TypeError("User ID must be a string");
    if (typeof roomId != "string") throw TypeError("Room ID must be a string");

    return new Promise<void>(async (resolve, fail) => {
      try {
        const stream = await this.requestUserMedia();
        await this.client?.join(roomId, userId, stream);
        this.status.set(VoiceStatus.CONNECTED);
        this.roomId.set(roomId);
        resolve();
      } catch (error) {
        console.error(error);
        this.status.set(VoiceStatus.ERRORED);
        fail(error);
      }
    });
  }

  // Disconnect from websocket
  disconnect() {
    this.connecting = false;
    this.status.set(VoiceStatus.READY);

    this.client?.disconnect();
    this.status.set(VoiceStatus.UNLOADED);
    this.roomId.set(undefined);
    participants.clear();
  }

  leave() {
    this.connecting = false;
    this.client?.leave();
    //get(this.stream)?.getTracks().forEach((track) => track.stop());
    this.status.set(VoiceStatus.READY);
    this.syncState();
  }

  async setAudio(value: boolean) {
    if (!this.client) {
      return;
    }

    this.audio.set(value);

    if (get(this.status) < VoiceStatus.RTC_CONNECTING) {
      return;
    }

    const user = this.client.user;

    try {
      if (user && user.streams.size) {
        const stream = user.streams.get(StreamKind.Default);
        value ? await stream.unmute("audio") : stream.mute("audio");
        this.client?.updateParticipant(user.id, {audio: value, streams: [stream]});
      } else if (value) {
        const stream = await this.requestUserMedia();
        if (stream) {
          this.client.publishTrack(stream);
        } else {
          console.warn("Failed to request audio");
          this.audio.set(false);
        }
      }
    } catch (error) {
      console.error(error);
    }
  }

  async setVideo(value: boolean) {
    if (!this.client) {
      return;
    }

    this.video.set(value);

    if (get(this.status) < VoiceStatus.RTC_CONNECTING) {
      console.warn("Cannot request video before connecting");
      return;
    }

    const user = this.client.user;

    try {
      if (user && user.streams.size) {
        const stream = user.streams[StreamKind.Default] as LocalStream;
        value ? await stream.unmute("video") : stream.mute("video");
        this.client?.updateParticipant(user.id, {video: value});
      } else if (value) {
        const stream = await this.requestUserMedia();
        if (stream) {
          this.client.publishTrack(stream);
        } else {
          console.warn("Failed to request video");
          this.video.set(false);
        }
      }
    } catch (error) {
      console.error(error);
    }
  }

  requestUserMedia() {
    if (get(this.status) == VoiceStatus.RTC_REQUEST) {
      console.warn("Already requesting user media");
      return;
    }

    const audio = get(this.audio);
    const video = get(this.video);
    if (!audio && !video) {
      console.warn("No audio or video requested");
      return;
    }

    this.status.set(VoiceStatus.RTC_REQUEST);

    const constraints = {
      audio,
      video,
      codec: "vp8",
      resolution: get(this.resolution),
    };
    return LocalStream.getUserMedia(constraints).catch((err) => {
      console.error(err);
      return undefined;
    });
  }

  async startDeafen() {
    this.deaf.set(true);
    this.syncState();
  }
  async stopDeafen() {
    this.deaf.set(false);
    this.syncState();
  }

  async startProducing(kind: "audio" | "video") {
    if (kind == "audio") this.setAudio(true);
    else if (kind == "video") this.setVideo(true);
    else return false;
    return true;
  }

  async stopProducing(kind: "audio" | "video") {
    if (kind == "audio") this.setAudio(false);
    else if (kind == "video") this.setVideo(false);
    else return false;
    return true;
  }

  async startDisplay(userId?: string) {
    if (!this.client) return false;
    const user = this.client.user;

    const constraints = {
      audio: true,
      video: true,
      monitorTypeSurfaces: "include",
      resolution: fromStore(this.resolution).current,
      codec: "vp8",
    };

    try {
      if (user && user.streams.size > 1) {
        console.debug("Screencast already active");
        const displayStream = user.streams[StreamKind.Screencast] as LocalStream;
        if (displayStream) {
          await displayStream.unmute("video");
        }
        this.client?.updateParticipant(user.id, {screencast: true });
        return true;
      }
      const stream = await LocalStream.getDisplayMedia(constraints);
      if (!stream) {
        console.warn("Failed to request video");
        this.screencast.set(false);
        return false;
      }

      stream.getTracks().forEach((track) => {
        track.addEventListener("ended", () => {
          this.stopDisplay();
        });
      });

      console.debug("Publishing display stream");
      this.client.publishTrack(stream, true);
      this.screencast.set(true);
    } catch (error) {
      console.error(error);
      return false;
    }
    return true;
  }

  /**
   * Stops screencasting. Deletes and unpublishes any local screencast stream.
   * This function will shorten the user streams list, because the screencast stream is an extra stream.
   */
  async stopDisplay() {
    if (!this.client) return false;
    const user = this.client.user;
    try {
      if (user && user.streams.size > 1) {
        const displayStream = user.streams.get(StreamKind.Screencast) as LocalStream;
        console.debug(user.streams);
        if (displayStream) {
          displayStream.unpublish("all");
          console.debug("Display stream unpublished");
          displayStream.getTracks().forEach((track) => track.stop());
          console.debug("Display stream stopped");
        }
      }
      this.screencast.set(false);
    } catch (error) {
      console.error(error);
      return false;
    }
    return true;
  }

  updateParticipant(user: VoiceUser) {
    const value = $state(user);
    participants.set(user.id, value);
    console.debug("Updated participant", value.id, value.active ? "speaking" : "idle", `[${value.streams.size} stream(s)]`);
  }
}

export const voiceState = new VoiceState();