<script>
    import { goto } from "$app/navigation";
    import { lastChannel } from "$lib";
    $effect(()=>{goto(`/channel/${lastChannel}`)})
</script>

Rendering...