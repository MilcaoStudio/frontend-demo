<script lang="ts">
    import Avatar from "../Avatar.svelte";
    import Username from "../user/Username.svelte";
    import { User } from "$lib/uprising.js";
    import { P3, P4 } from "vermeer-ui";
    import VideoAction from "../actions/VideoAction.svelte";
    import { voiceState, VoiceStatus } from "$lib/voice/VoiceState.svelte";
    import MicAction from "../actions/MicAction.svelte";
    import OutputAction from "../actions/OutputAction.svelte";
    import EndCallAction from "../actions/EndCallAction.svelte";
    import Clickable from "../Clickable.svelte";
  import { useClient } from "$lib/uprising.js/LocalClient";
  import { derived } from "svelte/store";
  import Link from "../Link.svelte";

    let { user }: { user: User } = $props();
    let voiceStatus = voiceState.status;
    let channelId = voiceState.roomId;
    let client = useClient();
    let channel = derived(channelId, (id)=>client.channels.get(id ?? ""));
    let statusDiplay = $state<"border" | "icon">("icon");
</script>

<div class="userArea">
    <div class="userControl">
        {#if $voiceStatus > VoiceStatus.RTC_CONNECTING}
            <div class="RTCInfo">
                {#if $channel}
                    <P3><Link href={$channel.path}>{$channel?.name}</Link></P3>
                {/if}
            </div>
        {/if}
        <div class="RTCControls">
            <div>
                <VideoAction size={20} />
            </div>
            <div>
                <MicAction size={20} />
                <OutputAction size={20} />
                {#if $voiceStatus > VoiceStatus.RTC_CONNECTING}
                    <EndCallAction />
                {/if}
            </div>
        </div>
    </div>

    <div class="userInfo">
        <Avatar size={40} target={user} withBorder={statusDiplay == "border"} withGraphic={statusDiplay == "icon"} />
        <div>
            <Clickable
                onclick={() => {
                    console.log("Clicked!");
                }}
            >
                <Username {user} color="var(--textMain)" />
            </Clickable>
            <P4 class="status">{user.status.text}</P4>
        </div>
    </div>
</div>

<style>
    .userArea {
        box-shadow: 0px 4px 6px 3px #000000;
        padding: 8px 16px;
    }

    .userControl {
        border-bottom: 2px solid var(--textMain);
    }

    .userInfo {
        display: flex;
        padding: 12px 0;
        gap: 16px;
    }

    .RTCControls {
        display: flex;
        justify-content: space-between;
    }

    .RTCControls > div {
        display: inline-flex;
        gap: 8px;
        padding: 12px 0;
    }
</style>
