import { SvelteMap, SvelteSet } from "svelte/reactivity";
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
    active = $state(false);
    tracks: Set<MediaStreamTrack["id"]>;
    streams: SvelteMap<string, LocalStream | RemoteStream>;

    constructor(data: VoiceUserData) {
        this.id = $state(data.id);
        this.audio = $state(data.audio ?? false);
        this.video = $state(data.video ?? false);
        this.screencast = $state(data.screencast ?? false);
        this.tracks = Array.isArray(data.tracks) ? new SvelteSet(data.tracks) : new SvelteSet;
        const entries: [string, (LocalStream | RemoteStream)][] = Array.isArray(data.streams) ? data.streams.map(s => [s.id, s]) : [];
        this.streams = new SvelteMap(entries)
    }

    /**
     * Adds a stream to this user if not exists. Othewise adds track to existing stream. This function should be used for remote streams only.
     * See {@link LocalVoiceUser.setDefaultStream} and {@link LocalVoiceUser.setScreencastStream} for local streams.
     */
    addStream(stream: RemoteStream, track: MediaStreamTrack) {
        let existing = this.streams.get(stream.id)
        if (existing) {
            existing.addTrack(track);
            console.debug("[%s] Stream %s exists, add track %s", this.id, existing.id, track.id);
        } else {
            stream.addTrack(track);
            this.streams.set(stream.id, stream);
            console.debug("[%s] Added stream %s", this.id, stream.id);
        }
        return this;
    }

    addTrack(track: MediaStreamTrack, stream: RemoteStream) {
        return this.addStream(stream, track);
    }

    clearStreams() {
        this.streams.forEach(s => {
            s.getTracks().forEach(t => {
                t.stop();
            })
        });
        this.streams.clear();
        console.debug("[%s] Cleared streams", this.id);
    }

    updateFromPartial(data: Partial<VoiceUserData>) {
        if ("audio" in data) this.audio = data.audio;
        if ("video" in data) this.video = data.video;
        if ("screencast" in data) this.screencast = data.screencast;
        if (Array.isArray(data.tracks)) this.tracks = new Set(data.tracks);
        if (data.streams) {
            const entries: [string, (LocalStream | RemoteStream)][] = Array.isArray(data.streams) ? data.streams.map(s => [s.id, s]) : [];
            this.streams = new SvelteMap(entries);
        }
    }
}