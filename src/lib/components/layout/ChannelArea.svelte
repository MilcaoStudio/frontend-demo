<script lang="ts">
  import type { Channel } from "uprising.js";
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
        min-width: fit-content;
        background: var(--bgHighlight);
        border: 1px solid var(--textMain);
        border-radius: var(--borderRadius);
    }
</style>
