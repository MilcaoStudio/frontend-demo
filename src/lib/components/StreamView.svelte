<script lang="ts">
    import { StreamKind } from "$lib/voice/LocalVoiceUser.svelte";
    import { getContext } from "svelte";
    import ScreencastView from "./ScreencastView.svelte";
    import VideoTrack from "./VideoTrack.svelte";
    import { User } from "uprising.js";
    import type { VoiceUser } from "$lib/voice/VoiceUser.svelte";
    
    let { id, stream, voiceUser, user }: { id: string; stream: MediaStream, user: User | undefined, voiceUser: VoiceUser } = $props();
    let me = getContext<User>("user");

    let muted = $state(me.id == user.id);

    function unmute() {
      muted = false;
    }

    function mute() {
      muted = true;
    }

    function close(this: MediaStreamTrack) {
      console.debug("Deleting track %s (%s)", this.id, this.kind);
      stream.removeTrack(this);
    }

    $effect(()=>{
      stream.addEventListener("addtrack", function(this: MediaStreamTrack) {
        console.debug("Track added (%s)", this.kind);
      });
      stream.getTracks().forEach(t => {
        t.addEventListener("unmute", unmute);
        t.addEventListener("mute", mute);
        t.addEventListener("ended", close);
      });
      return ()=>{
        stream.getTracks().forEach(t => {
          t.removeEventListener("unmute", unmute);
          t.removeEventListener("mute", mute);
          t.removeEventListener("ended", close);
        })
      }
    });


    $effect(()=>{
        console.debug("Inspecting stream");
        $inspect(stream);
    });
</script>

{#if id == StreamKind.Screencast && stream}
    <ScreencastView
        {stream}
        {user}
        {voiceUser}
        {muted}
    />
{:else if stream}
    <VideoTrack
        {stream}
        {user}
        {voiceUser}
        {muted}
    />
{/if}
