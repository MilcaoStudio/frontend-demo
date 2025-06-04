<script lang="ts">
  import type { RemoteStream } from "$lib/voice/Stream";

  let { stream }: { stream: RemoteStream } = $props();
  let ref: HTMLVideoElement | HTMLAudioElement | undefined = $state();

  $effect(() => {
    console.debug(stream);
    if (ref) ref.srcObject = stream;
  });

  function onclick() {
    console.debug(stream);
  }
</script>

<button class="control" {onclick}>
  {#if stream.video == "none"}
    <audio autoplay bind:this={ref}></audio>
  {:else}
    <!-- svelte-ignore a11y_media_has_caption -->
    <video autoplay bind:this={ref}></video>
  {/if}
</button>

<style>
  .control {
    background: transparent;
    border: unset;
    cursor: pointer;
  }
  video {
    width: 240px;
    height: 135px;
    object-fit: cover;
  }
</style>
