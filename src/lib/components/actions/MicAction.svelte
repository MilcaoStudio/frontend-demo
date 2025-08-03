<script lang="ts">
    import { voiceState } from "$lib/voice/VoiceState.svelte";
    import Icon from "@iconify/svelte";

    let { size }: { size: number } = $props();
    let enabled = voiceState.audio;
</script>

{#if $enabled}
    <Icon icon="bx:microphone" width={size} onclick={() => voiceState.stopProducing("audio")} />
{:else}
    <Icon icon="bx:microphone-off" color="red" width={size} onclick={() => voiceState.startProducing("audio")} />
{/if}
