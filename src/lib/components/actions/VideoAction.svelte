<script lang="ts">
    import { voiceState } from "$lib/voice/VoiceState";
    import Icon from "@iconify/svelte";

    let enabled = voiceState.video;
    let { size } : {size: number} = $props();
</script>

{#if $enabled}
    <Icon icon="bx:video" width={size} onclick={()=>voiceState.stopProducing("video")} />
{:else}
    <Icon icon="bx:video-off" color="red" width={size} onclick={()=>voiceState.startProducing("video")} />
{/if}