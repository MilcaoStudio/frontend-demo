<script lang="ts">
    import type { Snippet } from "svelte";
    let { onclick, children, className, ...rest }: { onclick?: () => void, children?: Snippet<[]>, className?: string } = $props();
</script>

<button class={className} onclick={onclick} {...rest}>
    {@render children?.()}
</button>

<style>
    button {
        cursor: pointer;
        border: none;
        background: none;
        padding: 0;
    }
</style>