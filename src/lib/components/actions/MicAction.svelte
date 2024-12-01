<script lang="ts">
    import { voiceState } from "$lib/voice/VoiceState";
    import Icon from "@iconify/svelte";
    import { IconButton } from "vermeer-ui";

    let { size }: { size: number } = $props();
    let enabled = voiceState.audio;
</script>

{#if $enabled}
    <IconButton isSmall onclick={() => voiceState.stopProducing("audio")}>
        <Icon icon="bx:microphone" width={size} />
    </IconButton>
{:else}
    <IconButton isSmall onclick={() => voiceState.startProducing("audio")}>
        <Icon icon="bx:microphone-off" color="red" width={size} />
    </IconButton>
{/if}
