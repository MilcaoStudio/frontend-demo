<script lang="ts">
    import type { Channel } from "$lib";
    import { getContext } from "svelte";
    import CallAction from "../CallAction.svelte";
    import { voiceState, VoiceStatus } from "$lib/voice/VoiceState";
    import VideoUi from "../VideoUI.svelte";
    import { P2, P4 } from "vermeer-ui";
    import ChannelName from "../channel/ChannelName.svelte";

    let { channel }: { channel: Channel } = $props();
    let userId = getContext<string | undefined>("user") ?? "";
    let status = voiceState.status;
</script>

<div class="header">
    <div class="headerRow">
        <div class="name">
            <P2 color="var(--textMain)"><ChannelName prefix {channel} /></P2>
            <P4 color="var(--textDim)">{channel.description}</P4>
        </div>
        <div class="actions">
            {#if channel.type == "voice"}
                <CallAction channelId={channel.id} {userId} />
            {/if}
        </div>
    </div>
    {#if $status >= VoiceStatus.RTC_CONNECTING}
        <VideoUi />
    {/if}
</div>

<style>
    .header {
        display: flex;
        flex-direction: column;
        box-shadow: 0 3px 1px var(--bgMain);
        border-radius: var(--borderRadius);
    }
    .headerRow {
        padding: 0 26px;
        display: flex;
        justify-content: space-between;
        height: 50px;
    }
    .headerRow .name {
        display: inline-flex;
        gap: 16px;
        align-items: center;
    }
    .actions {
        display: flex;
        gap: 8px;
        align-items: center;
    }
</style>
