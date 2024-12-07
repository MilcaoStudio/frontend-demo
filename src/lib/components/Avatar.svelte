<script lang="ts">
    import type { User } from "$lib/uprising.js";

    let {
        target,
        size,
        onclick,
    }: { target?: User; size: number; onclick?: () => {} } = $props();
</script>

{#if target && target.avatar}
    <svg width={size} height={size} viewBox="0 0 {size} {size}">
        <foreignObject x=0 y=0 width={size} height={size}>
            <img src="/avatars/{target.avatar}" alt="Avatar" />
        </foreignObject>
    </svg>
{:else}
    <span>Unknown user</span>
{/if}

<style>
    img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        border-radius: 50%;
    }
</style>
