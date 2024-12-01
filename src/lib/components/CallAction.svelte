<script lang="ts">
    import { voiceState, VoiceStatus } from "$lib/voice/VoiceState";
    import Icon from "@iconify/svelte";
    import { IconButton, P2 } from "vermeer-ui";
    import EndCallAction from "./actions/EndCallAction.svelte";

    let { channelId, userId }: { channelId: string; userId: string } = $props();

    let status = voiceState.status;

    function joinCall() {
        voiceState.join(channelId, userId);
    }

    
</script>

{#if $status == VoiceStatus.CONNECTED}
    <EndCallAction />
{:else}
    <IconButton onclick={joinCall}>
        <Icon icon="bx:phone-call" width="24" />
    </IconButton>
{/if}
<P2>Status: {$status}</P2>
