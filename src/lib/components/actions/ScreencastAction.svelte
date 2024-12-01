<script lang="ts">
    import { voiceState } from "$lib/voice/VoiceState";
    import Icon from "@iconify/svelte";

    let { size } : {size: number} = $props();
    let enabled = voiceState.screencast;
</script>

{#if $enabled}
    <Icon icon="tabler:device-desktop-x" color="red" width={size} onclick={()=>voiceState.stopDisplay()} />
{:else}
    <Icon icon="tabler:device-desktop-share" color="green" width={size} onclick={()=>voiceState.startDisplay()} />
{/if}