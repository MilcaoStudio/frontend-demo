<script>
    import { voiceState } from "$lib/voice/VoiceState";
    import Icon from "@iconify/svelte";
    import { IconButton } from "vermeer-ui";

    function leaveCall() {
        voiceState.leave();
    }
</script>

<IconButton isSmall onclick={leaveCall}>
    <Icon icon="bx:phone-off" color="red" width="24" />
</IconButton>