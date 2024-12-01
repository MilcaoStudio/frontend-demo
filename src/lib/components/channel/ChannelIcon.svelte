<script lang="ts">
    import type { Channel } from "$lib";
    import Icon from "@iconify/svelte";
    let { channel }: { channel: Channel } = $props();
</script>

{#if channel.type == "text"}
    <Icon icon="bx:hash" width=18 />
{:else if channel.type == "voice"}
    <Icon icon="bx:microphone" width=18 />
{/if}