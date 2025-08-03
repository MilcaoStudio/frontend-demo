<script lang="ts">
  import type { User } from "uprising.js";
  import Avatar from "./Avatar.svelte";
  import Clickable from "./Clickable.svelte";
  import UserDisplay from "./UserDisplay.svelte";
  import type { VoiceUser } from "$lib/voice/VoiceUser.svelte";
    import { voiceState } from "$lib/voice/VoiceState.svelte";
    let { stream, user, voiceUser, muted = false }: { stream: MediaStream, user: User | undefined, voiceUser: VoiceUser, muted?: boolean } = $props();
    let ref: HTMLVideoElement | HTMLAudioElement | undefined = $state();
    let videoTracks = $state(stream.getVideoTracks());
    let speaking = $derived(voiceUser.active);

    function addTrack(this: MediaStream, ev: MediaStreamTrackEvent) {
      console.debug("Track added", ev.track.id);
      videoTracks = this.getVideoTracks();
      $inspect(videoTracks);
    }

    voiceState.video.subscribe(video => {
      if (video) {
        videoTracks = stream.getVideoTracks();
      } else {
        videoTracks = stream.getVideoTracks().filter(t => t.readyState != "ended");
      }
    });
    
    function close(this: MediaStreamTrack) {
      if (!this) {
        return;
      }
      videoTracks = stream.getVideoTracks().filter(t => t.readyState != "ended");
    }
    
    $effect(() => {
      if (ref) ref.srcObject = stream;
    });

    $effect(() => {
      stream.addEventListener("addtrack", addTrack);

      return () => {
        stream.removeEventListener("addtrack", addTrack);
      }
    });

    $effect(()=>{
      stream.getTracks().forEach(t => {
        t.addEventListener("ended", close);
      });
      return ()=>{
        stream.getTracks().forEach(t => {
          t.removeEventListener("ended", close);
        })
      }
    });
  
    function onclick() {
      console.groupCollapsed("on click");
      videoTracks = stream.getVideoTracks().filter(t => t.readyState != "ended");
      if (ref) {
        console.debug("Media state: Volume %d, %s, %s", ref.volume, ref.muted ? "muted": "not muted", ref.paused ? "paused" : "playing");
        console.debug("Actual media", ref.srcObject);
      }
      console.debug("Video tracks (state)", $state.snapshot(videoTracks));
      console.groupEnd();
    }
  </script>
  
  <Clickable {onclick}>
    {#if !videoTracks.length}
    <UserDisplay user={user} {speaking}>
      <audio autoplay bind:this={ref} {muted}></audio>
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
        <video autoplay bind:this={ref} {muted}></video>
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
  