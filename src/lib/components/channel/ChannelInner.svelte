<script lang="ts">
    import type { Channel } from "$lib";
    import ChannelName from "./ChannelName.svelte";

    let { channel }: { channel: Channel } = $props();
</script>

<div class="channelInner">
    <!-- Mentions -->
    <ChannelName {channel} />
</div>

<style>
    .channelInner {
        display: inline-flex;
        padding: 6px 0;
        gap: 8px;
        color: var(--textDim);
    }
</style>
