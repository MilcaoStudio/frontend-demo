<script lang="ts">
    import { voiceState } from "$lib/voice/VoiceState";
    import { getContext } from "svelte";
    import MicAction from "./actions/MicAction.svelte";
    import Avatar from "./Avatar.svelte";
    import VideoTrack from "./VideoTrack.svelte";
    import type { User } from "uprising.js";
    import VideoAction from "./actions/VideoAction.svelte";
    import ScreencastAction from "./actions/ScreencastAction.svelte";

    //let stream = voiceState.stream;
    let streams = voiceState.streams;
    $: callStream = streams.get("user");
    $: displayStream = streams.get("display");
    let user = getContext<User>("user");
</script>

<div class="displayContainer">
    <div class="row">
        <Avatar size={80} target={user} />
        {#if callStream}
            {#each callStream.getVideoTracks() as track (track.id)}
                <VideoTrack stream={callStream} />
            {/each}
        {/if}
        {#if displayStream}
            {#each displayStream.getVideoTracks() as track (track.id)}
                <VideoTrack stream={displayStream} />
            {/each}
        {/if}
    </div>

    <div class="actions">
        <MicAction size={32} />
        <VideoAction size={32} />
        <ScreencastAction size={32} />
    </div>
</div>

<style>
    .displayContainer {
        display: flex;
        flex-direction: column;
        gap: 16px;
        padding: 20px 0;
        background: var(--bgHighlight);
    }
    .row {
        display: flex;
        gap: 16px;
        align-items: center;
        justify-content: center;
    }
    .actions {
        display: flex;
        gap: 32px;
        justify-content: center;
    }
</style>
