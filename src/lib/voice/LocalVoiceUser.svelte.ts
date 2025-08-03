import { VoiceUser, type VoiceUserData } from "./VoiceUser.svelte";
import { type LocalStream } from "./Stream";

/**
 * Kind of stream this user may publish.
 */
export enum StreamKind {
    /**
     * Default user media stream. This stream may come from a webcam or microphone.
     */
    Default = "DEFAULT",
    /**
     * Screencast stream. This stream may come from a screen capturer.
     */
    Screencast = "SCREENCAST",
}

export class LocalVoiceUser extends VoiceUser {
    constructor(data: VoiceUserData) {
        console.debug(data);
        super(data);
    }

    /**
     * Sets default stream for this user.
     */
    setDefaultStream(stream: LocalStream) {
        if (this.streams.has(StreamKind.Default)) {
            console.warn("Already Default Stream. Assert this stream is stopped and unpublished.");
        }
        this.streams.set(StreamKind.Default, stream);
        console.debug("[%s] Set default stream %s", this.id, stream.id);
        return this;
    }

    /**
     * Sets screencast stream for this user.
     */
    setScreencastStream(stream: LocalStream) {
        if (this.streams.has(StreamKind.Default)) {
            console.warn("Already Screencast Stream. Assert this stream is stopped and unpublished.");
        }
        this.streams.set(StreamKind.Screencast, stream);
        console.debug("[%s] Set screencast stream %s", this.id, stream.id);
        return this;
    }
}