<script lang="ts">
    import { voiceState } from "$lib/voice/VoiceState";
    import Icon from "@iconify/svelte";
    import { IconButton } from "vermeer-ui";

    let {size}: {size: number} = $props();
    let deaf = voiceState.deaf;
</script>

{#if !$deaf}
    <IconButton isSmall onclick={() => {
        console.warn("Deaf functionality is not yet implemented");}}>
        <Icon icon="tabler:headphones" width={size} />
    </IconButton>
{:else}
    <IconButton isSmall onclick={() => voiceState.stopDeafen()}>
        <Icon icon="tabler:headphones-off" color="red" width={size} />
    </IconButton>
{/if}