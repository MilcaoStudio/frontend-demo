<script>
    import { goto } from "$app/navigation";
    import { lastChannel } from "$lib";
    import { base } from "$app/paths";
    $effect(()=>{goto(`${base}/channel/${lastChannel}`)})
</script>

Rendering...