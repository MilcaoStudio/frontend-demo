<script lang="ts">
  import { participants } from "$lib/voice/VoiceState.svelte";
  import MicAction from "./actions/MicAction.svelte";

  import { User } from "uprising.js";
  import VideoAction from "./actions/VideoAction.svelte";
  import ScreencastAction from "./actions/ScreencastAction.svelte";
  import UserDisplay from "./UserDisplay.svelte";
  import StreamView from "./StreamView.svelte";
  
  let users = $derived.by(() =>{
    const keys = [...participants.keys()];
    return new Map(
      keys.map((id) => [
        id,
        User.create({ id, username: id }),
      ])
    )}
  );

  let values = $derived(Array.from(participants.values()));
</script>

<div class="displayContainer">
  {#each values as user (user.id)}
    <div class="row">
      {#if user.streams.size}
        {#each user.streams.entries() as [index, stream] (stream ? stream.id : index)}
          <StreamView id={index} user={users.get(user.id)} voiceUser={user} {stream} />
        {/each}
      {:else}
        <UserDisplay user={users.get(user.id)} />
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
