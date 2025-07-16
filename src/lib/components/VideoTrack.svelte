<script lang="ts">
    import type { User } from "uprising.js";
  import Avatar from "./Avatar.svelte";
  import Clickable from "./Clickable.svelte";
  import UserDisplay from "./UserDisplay.svelte";
  import type { VoiceUser } from "$lib/voice/VoiceUser";

    let { stream, user, voiceUser }: { stream: MediaStream, user: User | undefined, voiceUser: VoiceUser } = $props();
    let ref: HTMLVideoElement | HTMLAudioElement | undefined = $state();
    let videoTracks = $state(stream.getVideoTracks());
  
    $effect(() => {
      videoTracks = stream.getVideoTracks();
      if (ref) ref.srcObject = stream;
    });
  
    function onclick() {
      videoTracks = stream.getVideoTracks();
      console.debug(stream);
    }

    $inspect(user);
  </script>
  
  <Clickable {onclick}>
    {#if !videoTracks.length}
    <UserDisplay user={user} speaking={voiceUser.active}>
      <audio autoplay bind:this={ref}></audio>
    </UserDisplay>
    {:else}
    <div class="container">
      <div class="video-overlay display-hover">
        <div class="inline-flex">
          <Avatar target={user} size={20} />
          <p class="username">{user?.username}</p>
        </div>
      </div>
        <!-- svelte-ignore a11y_media_has_caption -->
        <video autoplay bind:this={ref}></video>
    </div>
    {/if}
  </Clickable>
  
  <style>
    .container {
      border: 2px solid var(--textDim);
      border-radius: var(--borderRadius, 3px);
    }
    video {
      width: 320px;
      height: 180px;
      object-fit: cover;
    }
    .video-overlay {
      position: absolute;
      width: 320px;
      height: 180px;
    }

    .inline-flex {
      display: inline-flex;
      gap: 8px;
      place-content: center;
      padding-bottom: 12px;
      position: absolute;
      width: 100%;
      left: 0;
      bottom: 0;
    }

    .username {
      font-weight: 600;
      color: white;
      text-shadow: 3px 3px 4px black;
    }
    .display-hover {
      opacity: 0;
    }
    .display-hover:hover {
      opacity: 1;
    }
  </style>
  