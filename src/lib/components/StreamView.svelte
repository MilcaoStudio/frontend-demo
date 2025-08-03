<script lang="ts">
    import { StreamKind } from "$lib/voice/LocalVoiceUser.svelte";
    import { getContext } from "svelte";
    import ScreencastView from "./ScreencastView.svelte";
    import VideoTrack from "./VideoTrack.svelte";
    import { User } from "uprising.js";
    import type { VoiceUser } from "$lib/voice/VoiceUser.svelte";
    
    let { id, stream, voiceUser, user }: { id: string; stream: MediaStream, user: User | undefined, voiceUser: VoiceUser } = $props();
    let me = getContext<User>("user");
    $effect(()=>{
        console.debug("Inspecting stream");
        $inspect(stream);
        console.debug("Inspecting user streams");
        $inspect(voiceUser.streams);
    });
</script>

{#if id == StreamKind.Screencast && stream}
    <ScreencastView
        {stream}
        {user}
        {voiceUser}
        muted={me.id == user.id}
    />
{:else if stream}
    <VideoTrack
        {stream}
        {user}
        {voiceUser}
        muted={me.id == user.id}
    />
{/if}
