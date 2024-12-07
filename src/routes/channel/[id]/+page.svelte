<script>
    import { getChannel } from "$lib";
    import ChannelArea from "$lib/components/layout/ChannelArea.svelte";
    let { data } = $props();

    let channel = $derived(getChannel(data.id));
    $effect(() => {
        if (channel) {  
            document.title = `#${channel.name} | Uprising demo`;
        }
    });
</script>
{#if channel}
    <ChannelArea {channel} />
{/if}
