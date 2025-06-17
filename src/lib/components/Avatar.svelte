<script lang="ts">
    import type { User } from "$lib/uprising.js";

    let {
        target,
        size,
        borderColor = "none",
        onclick,
    }: { target?: User; size: number; borderColor?: string; onclick?: () => {} } = $props();
</script>

{#if target && target.avatar}
    <svg width={size} height={size} viewBox="0 0 {size} {size}">
        <foreignObject class:border={borderColor && borderColor != "none"} width={size} height={size} style:--borderColor={borderColor}>
            <img src={target.avatar} alt="Avatar" />
        </foreignObject>
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

    foreignObject.border {
        border: 2px solid var(--borderColor);
    }
</style>
