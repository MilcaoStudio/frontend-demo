<script lang="ts">
    import { goto } from "$app/navigation";
    import type { Server } from "$lib";
    import { ChannelButton } from "vermeer-ui";
    import ChannelInner from "../channel/ChannelInner.svelte";
    import ChannelIcon from "../channel/ChannelIcon.svelte";
    import { base } from "$app/paths";
    let { server }: { server: Server } = $props();
    let channels = $state(server.channels ?? []);
    let selected = $state(channels[0].id);
</script>

<div class="list" role="list">
    {#each channels as channel (channel.id)}
        <ChannelButton
            role="listitem"
            variant={selected == channel.id ? "active" : "default"}
            onclick={() => {
                selected = channel.id;
                goto(`${base}/channel/${channel.id}`);
            }}
            ><svelte:fragment slot="icon">
                <ChannelIcon {channel} />
            </svelte:fragment>
            <ChannelInner {channel} />
        </ChannelButton>
    {/each}
</div>

<style>
    .list {
        display: flex;
        flex-direction: column;
        flex: 1;
        padding: 10px 4px;
        gap: 6px;
    }
</style>
