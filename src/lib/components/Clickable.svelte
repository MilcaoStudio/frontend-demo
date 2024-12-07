<script lang="ts">
    import type { Snippet } from "svelte";

    let { onclick, children, ...rest }: { onclick?: () => void, children?: Snippet<[]> } = $props();
</script>

<button onclick={onclick} {...rest}>
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