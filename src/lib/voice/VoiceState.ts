import { fromStore, get, writable, type Writable } from "svelte/store";
import { LocalStream, type RemoteStream } from "./Stream";
import type { MediaType, VoiceUser } from "./Voice";
import type VoiceClient from "./VoiceClient";
import { SvelteMap } from "svelte/reactivity";
import { env } from "$env/dynamic/public";

export enum VoiceStatus {
    // Default state, no connections
    UNLOADED = 0,
    // RTC is not available
    UNAVAILABLE,
    // There was an error and connection fails
    ERRORED,
    // Preparing voice client
    LOADING = 3,
    // Connecting to signaling websocket
    CONNECTING = 4,
    // Connected to signaling websocket
    READY = 5,
    // Connecting to server RTC peer
    RTC_CONNECTING,
    // Connected to RTC peer
    CONNECTED,
}

class VoiceState {
    client?: VoiceClient;
    connecting?: boolean;

    audio: Writable<boolean> = writable(true);
    video: Writable<boolean> = writable(false);
    screencast: Writable<boolean> = writable(false);
    resolution: Writable<string> = writable("hd");
    error: Writable<string> = writable();
    status: Writable<VoiceStatus>;
    stream: Writable<LocalStream> = writable();
    streams: Map<string, LocalStream> = new SvelteMap;
    roomId: string | null;
    participants: Map<string, VoiceUser>;
    tracks: Map<string, RemoteStream>;

    constructor() {
        this.roomId = null;
        this.status = writable(VoiceStatus.UNLOADED);
        this.participants = new SvelteMap;
        this.tracks = new SvelteMap;

        this.syncState = this.syncState.bind(this);
        this.connect = this.connect.bind(this);
        this.disconnect = this.disconnect.bind(this);
    }

    // This takes information from the voice
    // client and applies it to the state here.
    syncState() {
        if (!this.client) return;
        this.roomId = this.client.roomId ?? null;
        this.participants.clear();
        this.client.participants.forEach((v, k) => this.participants.set(k, v));
    }

    // This imports and constructs the voice client.
    async loadVoice() {
        const status = fromStore(this.status);
        if (status.current != VoiceStatus.UNLOADED) return;
        this.status.set(VoiceStatus.LOADING);

        try {
            const { default: VoiceClient } = await import("./VoiceClient");
            const client = new VoiceClient();

            client.on("ready", this.syncState);
            client.on("userJoined", this.syncState);
            client.on("userLeft", this.syncState);
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
            await this.client.connect(env.PUBLIC_VOSO_URL ?? "ws://localhost:4000", token);
            this.status.set(VoiceStatus.READY);
            this.syncState();
        } catch (err) {
            console.error(err);
            this.status.set(VoiceStatus.ERRORED);
        }
    }

    async join(roomId: string, userId: string) {
        this.status.set(VoiceStatus.RTC_CONNECTING);
        const constraints = {
            audio: fromStore(this.audio).current,
            video: fromStore(this.video).current,
            codec: "vp8",
            resolution: fromStore(this.resolution).current,
        };
        return new Promise((resolve, fail) => {
            try {
                this.client?.join(roomId, userId).then(()=>{
                    LocalStream.getUserMedia(constraints).then(
                        (stream) =>{
                            //this.stream.set(stream);
                            this.streams.set("user", stream);
                            this.client?.publishTrack(stream);
                        }
                    ).then(resolve).catch(fail);
                });
                this.status.set(VoiceStatus.CONNECTED);
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
        this.syncState();
    }

    leave() {
        this.connecting = false;
        this.client?.signaling.leave();
        this.status.set(VoiceStatus.READY);
        this.syncState();
    }
    
    isDeaf() {
        if (!this.client) return false;

        return this.client.isDeaf;
    }

    async startDeafen() {
        if (!this.client) return console.log("No client object"); // ! TODO: let the user know
        if (this.client.isDeaf) return;

        this.client.isDeaf = true;

        this.syncState();
    }
    async stopDeafen() {
        if (!this.client) return console.log("No client object"); // ! TODO: let the user know
        if (!this.client.isDeaf) return;

        this.client.isDeaf = false;

        this.syncState();
    }

    async startProducing(kind: "audio" | "video") {
        const stream = this.streams.get("user");
        if (!stream) return false;
        try {
            stream.unmute(kind);
        } catch (error) {
            console.error(error);
            return false;
        }
        if (kind == "audio") this.audio.set(true);
        else if (kind == "video") this.video.set(true);
        return true;
    }

    async stopProducing(kind: "audio" | "video") {
        const stream = this.streams.get("user");
        if (!stream) return false;
        try {
            stream.mute(kind);
        } catch (error) {
            console.error(error);
            return false;
        }
        if (kind == "audio") this.audio.set(false);
        else if (kind == "video") this.video.set(false);
        return true;
    }

    async startDisplay() {
        const constraints = {
            audio: true,
            video: true,
            monitorTypeSurfaces: "include",
            resolution: fromStore(this.resolution).current,
            codec: "vp8",
        }
        try {
            const stream = await LocalStream.getDisplayMedia(constraints);
            this.streams.set("display", stream);
            //this.stream.set(stream);
            this.screencast.set(true);
            this.client?.publishTrack(stream);
        } catch (error) {
            console.error(error);
            return false;
        }
        return true;
    }

    async stopDisplay() {
        const stream = this.streams.get("display");
        if (!stream) return false;
        try {
            stream.unpublish();
            stream.getTracks().forEach((track) => track.stop());
            this.screencast.set(false);
        } catch (error) {
            console.error(error);
            return false;
        }
        return true;
    }
}

export const voiceState = new VoiceState();