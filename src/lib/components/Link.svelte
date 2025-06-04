<script lang="ts">
    import type { Snippet } from "svelte";
  import type { HTMLAnchorAttributes } from "svelte/elements";

    let { children, ...rest }: { children?: Snippet<[]> } & HTMLAnchorAttributes  = $props();
</script>

<a class="link" {...rest}>
    {@render children?.()}
</a>

<style>
    .link {
        text-decoration: none;
        color: var(--textMain);
        transition: all 0.2s ease-in-out;
    }
    .link:hover {
        text-decoration: underline;
    }
</style>