<script lang="ts">
  import { voiceState } from "$lib/voice/VoiceState";
  import MicAction from "./actions/MicAction.svelte";
  import Avatar from "./Avatar.svelte";
  import VideoTrack from "./VideoTrack.svelte";
  import { User } from "uprising.js";
  import VideoAction from "./actions/VideoAction.svelte";
  import ScreencastAction from "./actions/ScreencastAction.svelte";
  import UserDisplay from "./UserDisplay.svelte";

  //let stream = voiceState.stream;
  let streams = voiceState.streams;
  let participants = voiceState.participants;
  let users = $derived.by(() =>{
    const keys = [...participants.keys()];
    console.debug("Participants (ids)", keys);
    return new Map(
      keys.map((id) => [
        id,
        User.create({ id, username: id }),
      ])
    )}
  );

  //let localVideoStream = $state(streams.get("user"));
  //let localDisplayStream = $state(streams.get("display"));
</script>

<div class="displayContainer">
  {#each participants.entries() as [id, data] (id)}
    <div class="row">
      {#if data.streams.length}
        {#each data.streams as stream (stream.id)}
            <VideoTrack stream={stream} user={users.get(id)} />
        {/each}
      {:else}
        <UserDisplay user={users.get(id)} />
      {/if}
    </div>
  {/each}

  <!-- TODO: View remote streams -->
  <div class="actions">
    <MicAction size={28} />
    <VideoAction size={32} />
    <ScreencastAction size={32} />
  </div>
</div>

<style>
  .displayContainer {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 20px 0;
    background: var(--bgHighlight);
  }
  .row {
    display: flex;
    gap: 16px;
    align-items: center;
    justify-content: center;
  }
  .actions {
    display: flex;
    gap: 32px;
    justify-content: center;
  }
</style>
