<script lang="ts">
    import type { Channel } from "$lib";
    let { channel, prefix }: { channel: Channel, prefix?: boolean } = $props();
</script>

<span>
    {#if channel.type == "text"}
        {prefix ? "#" : ""}{channel.name}
    {:else if channel.type == "dm"}
        {prefix ? "@" : ""}{channel.name}
    {:else}
        {channel.name}
    {/if}
</span>