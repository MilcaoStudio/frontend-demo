<script lang="ts">
    let {stream}: {stream: MediaStream} = $props();
    let ref: HTMLVideoElement;
    
    $effect(()=>{
        ref.srcObject = stream;
    });
</script>

<!-- svelte-ignore a11y_media_has_caption -->
<video autoplay bind:this={ref}></video>

<style>
    video {
        width: 240px;
        height: 135px;
        object-fit: cover;
    }
</style>