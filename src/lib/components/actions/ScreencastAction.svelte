<script lang="ts">
    import { voiceState } from "$lib/voice/VoiceState";
    import Icon from "@iconify/svelte";
  import { getContext } from "svelte";
  import type { User } from "uprising.js";

    let { size } : {size: number} = $props();
    let enabled = voiceState.screencast;
    let user = getContext<User>("user");
</script>

{#if $enabled}
    <Icon icon="tabler:device-desktop-x" color="red" width={size} onclick={()=>voiceState.stopDisplay()} />
{:else}
    <Icon icon="tabler:device-desktop-share" color="green" width={size} onclick={()=>voiceState.startDisplay(user.id)} />
{/if}