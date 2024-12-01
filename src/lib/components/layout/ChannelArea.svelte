<script lang="ts">
    import type { Channel } from "$lib";
    import ChannelHeader from "./ChannelHeader.svelte";

    let { channel }: { channel: Channel } = $props();
</script>

<div class="channelArea">
    <ChannelHeader {channel} />
    <!-- Message Area  -->
    <div></div>
    <!-- Message Input  -->
    <div></div>
</div>

<style>
    .channelArea {
        margin: 8px 0 20px;
        padding: 0 0 16px;
        flex-grow: 1;
        background: var(--bgHighlight);
        border: 1px solid var(--textMain);
        border-radius: var(--borderRadius);
    }
</style>
