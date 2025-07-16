import type { LocalStream, RemoteStream } from "./Stream";

export interface VoiceUserData {
    id: string;
    audio?: boolean;
    video?: boolean;
    screencast?: boolean;
    tracks?: string[];
    streams?: (LocalStream | RemoteStream)[];
}

export class VoiceUser {
    id: string;
    audio: boolean;
    video: boolean;
    screencast: boolean;
    active = false;
    tracks: Set<MediaStreamTrack["id"]>;
    streams: (LocalStream | RemoteStream)[];

    constructor(data: VoiceUserData) {
        this.id = data.id;
        this.audio = data.audio ?? false;
        this.video = data.video ?? false;
        this.screencast = data.screencast ?? false;
        this.tracks = Array.isArray(data.tracks) ? new Set(data.tracks) : new Set;
        this.streams = Array.isArray(data.streams) ? data.streams : [];
    }

    addStream(stream: LocalStream | RemoteStream) {
        this.streams.push(stream);
        console.debug("[%s] Added stream %s", this.id, stream.id);
        return this;
    }

    clearStreams() {
        this.streams.forEach(s => {
            s.getTracks().forEach(t => {
                t.stop();
            })
        });
        console.debug("[%s] Cleared streams", this.id);
    }

    update(data: Partial<VoiceUserData>) {
        if ("audio" in data) this.audio = data.audio;
        if ("video" in data) this.video = data.video;
        if ("screencast" in data) this.screencast = data.screencast;
        if (Array.isArray(data.tracks)) this.tracks = new Set(data.tracks);
        if (Array.isArray(data.streams)) this.streams = data.streams;
    }
}