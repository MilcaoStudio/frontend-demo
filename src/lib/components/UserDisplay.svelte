<script lang="ts">
  import type { Snippet } from "svelte";
  import type { User } from "uprising.js";
  import Avatar from "./Avatar.svelte";

    let { user, children }: { user?: User, children?: Snippet<[]> } = $props();
</script>

<div class="user-display">
    <Avatar target={user} size={80} />
    {@render children?.()}
</div>

<style>
    .user-display {
      width: 320px;
      height: 180px;
      display: flex;
      justify-content: center;
      align-items: center;
      border: 2px solid var(--textDim);
      border-radius: var(--borderRadius, 3px);
      background-color: var(--bgMain);
    }
</style>