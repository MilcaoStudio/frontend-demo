<script lang="ts">
  import Icon from "@iconify/svelte";
  import type { Snippet } from "svelte";
  import { P3 } from "vermeer-ui";
  import Clickable from "./Clickable.svelte";

  let {
    open = false,
    name,
    children,
  }: { open?: boolean; name: string; children?: Snippet } = $props();
</script>

<Clickable onclick={() => (open = !open)}>
  <div class="collapsable">
    {#if open}
      <Icon icon="bxs:down-arrow" width={14} />
    {:else}
      <Icon icon="bxs:right-arrow" width={14} />
    {/if}
    <P3>{name}</P3>
  </div>
</Clickable>
{#if open}
  <ul class="list">
    {@render children?.()}
  </ul>
{/if}

<style>
  ul {
    padding: 0;
    margin: 4px 0;
  }
  .collapsable {
    display: flex;
    flex-direction: row;
    gap: 8px;
    padding-top: 8px;
    padding-left: 8px;
  }
</style>
