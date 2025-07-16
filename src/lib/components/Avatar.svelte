<script lang="ts">
    import type { User } from "$lib/uprising.js";
  import StatusGraphic from "./user/StatusGraphic.svelte";

    let {
        target,
        size,
        withBorder = false,
        withGraphic = false,
        status,
    }: { target?: User; size: number; withBorder?: boolean; withGraphic?: boolean, status?: string } = $props();
    let center = $derived(size / 2);
    let graphicRadius = Math.floor(size / 6);
    let userStatus = $derived(status || target?.status.mode);
</script>

{#if target && target.avatar}
<svg width={size} height={size} viewBox="0 0 {size} {size}">
    {#if withBorder}
        <circle cx={center} cy={center} r={center - 2} stroke="var(--status-{userStatus})" stroke-width="4" />
    {/if}
    <foreignObject x="2" y="2" width={size - 4} height={size - 4}>
        <img src={target.avatar} alt="Avatar" />
    </foreignObject>
    {#if withGraphic}
        <StatusGraphic status={target.status.mode} offset={size - graphicRadius} size={graphicRadius} />
    {/if}
  </svg>
{/if}

<style>
    img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    foreignObject {
        border-radius: 50%;
    }
</style>
