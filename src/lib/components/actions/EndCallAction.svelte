<script>
    import { voiceState } from "$lib/voice/VoiceState.svelte";
    import Icon from "@iconify/svelte";
    import { getContext } from "svelte";
    import { IconButton } from "vermeer-ui";

    const user = getContext("user");
    function leaveCall() {
        voiceState.leave();
    }
</script>

<IconButton isSmall onclick={leaveCall}>
    <Icon icon="bx:phone-off" color="red" width="24" />
</IconButton>