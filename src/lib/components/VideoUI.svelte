<script lang="ts">
  import { voiceState } from "$lib/voice/VoiceState.svelte";
  import MicAction from "./actions/MicAction.svelte";
  import VideoTrack from "./VideoTrack.svelte";
  import { User } from "uprising.js";
  import VideoAction from "./actions/VideoAction.svelte";
  import ScreencastAction from "./actions/ScreencastAction.svelte";
  import UserDisplay from "./UserDisplay.svelte";
  import { getContext } from "svelte";

  let participants = voiceState.participants;
  $inspect(participants);
  let me = getContext<User>("user");
  let users = $derived.by(() =>{
    const keys = [...participants.keys()];
    return new Map(
      keys.map((id) => [
        id,
        User.create({ id, username: id }),
      ])
    )}
  );
</script>

<div class="displayContainer">
  {#each participants.values() as user (user.id)}
    <div class="row {user.active ? 'speaking' : 'idle'}">
      {#if user.streams.length}
        {#each user.streams as stream (stream.id)}
            <VideoTrack stream={stream} user={users.get(user.id)} voiceUser={user} muted={me.id == user.id} />
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
