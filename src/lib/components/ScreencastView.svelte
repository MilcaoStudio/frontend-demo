<script lang="ts">
  import type { User } from "uprising.js";
  import Avatar from "./Avatar.svelte";
  import Clickable from "./Clickable.svelte";
  import type { VoiceUser } from "$lib/voice/VoiceUser.svelte";

  let {
    stream,
    user,
    muted = false,
  }: {
    stream: MediaStream;
    user: User | undefined;
    voiceUser: VoiceUser;
    muted?: boolean;
  } = $props();
  let ref: HTMLVideoElement | HTMLAudioElement | undefined = $state();

  /**
   * Whether this stream was received from the remote peer or not.
   */
  let enabled = $state(true);
  let videoTracks = $state(stream.getVideoTracks());

  function unmute() {
    muted = false;
  }

  function mute() {
    muted = true;
  }

  $effect(() => {
    stream.getTracks().forEach((t) => {
      t.addEventListener("unmute", unmute);
      t.addEventListener("mute", mute);
    });
    return () => {
      stream.getTracks().forEach((t) => {
        t.removeEventListener("unmute", unmute);
        t.removeEventListener("mute", mute);
      });
    };
  });

  $effect(() => {
    videoTracks = stream.getVideoTracks();
    if (ref) ref.srcObject = stream;
  });

  function onclick() {
    enabled = true;
    console.groupCollapsed("on click");
    console.debug("Actual video tracks", stream.getVideoTracks());
    console.debug("State", videoTracks);
    console.groupEnd();
  }
</script>

<Clickable {onclick}>
  {#if videoTracks.length}
    <div class="container">
      {#if enabled}
        <div class="video-overlay display-hover">
          <div class="inline-flex">
            <Avatar target={user} size={20} />
            <p class="username">{user?.username}</p>
          </div>
        </div>
        <!-- svelte-ignore a11y_media_has_caption -->
        <video autoplay bind:this={ref} {muted}></video>
      {:else}
        <div class="stream-preview">
          <button class="watch">Watch Stream</button>
        </div>
      {/if}
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

  .stream-preview {
    width: 320px;
    height: 180px;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: var(--bgMain);
  }

  .watch {
    background-color: var(--bgSecondary);
    color: var(--textDim);
    font-size: 18px;
    padding: var(--padding-m);
    border-radius: 20px;
  }

  .watch:hover {
    background-color: var(--bgHover);
  }
</style>
