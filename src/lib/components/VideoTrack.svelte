<script lang="ts">
    let {stream}: {stream: MediaStream} = $props();
    let ref: HTMLVideoElement|undefined;

    $effect(()=>{
        console.debug(stream);
        if (ref) ref.srcObject = stream;
    });

    function onclick() {
        console.debug(stream);
    }
</script>

<button class="control" onclick={onclick}>
    <!-- svelte-ignore a11y_media_has_caption -->
    <video autoplay bind:this={ref}></video>
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