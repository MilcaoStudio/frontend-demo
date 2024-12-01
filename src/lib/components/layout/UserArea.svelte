<script lang="ts">
    import Avatar from "../Avatar.svelte";
    import Username from "../user/Username.svelte";
    import { User } from "$lib/uprising.js";
    import { P4 } from "vermeer-ui";
    import VideoAction from "../actions/VideoAction.svelte";
    import { voiceState, VoiceStatus } from "$lib/voice/VoiceState";
    import MicAction from "../actions/MicAction.svelte";
    import OutputAction from "../actions/OutputAction.svelte";
    import EndCallAction from "../actions/EndCallAction.svelte";

    let { user }: { user: User } = $props();
    let voiceStatus = voiceState.status;
</script>

<div class="userArea">
    {#if $voiceStatus > VoiceStatus.RTC_CONNECTING}
        <div class="userControl">
            <div class="RTCInfo"></div>
            <div class="RTCControls">
                <div>
                    <VideoAction size={20} />
                </div>
                <div>
                    <MicAction size={20} />
                    <OutputAction size={20} />
                    <EndCallAction />
                </div>
            </div>
        </div>
    {/if}

    <div class="userInfo">
        <Avatar size={40} target={user} />
        <div>
            <Username {user} />
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

    :global(.status) {
        margin: 0;
    }
</style>
