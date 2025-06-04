<script lang="ts">
  import type { Snippet } from "svelte";
  import type { User } from "uprising.js";
  import Avatar from "./Avatar.svelte";
  import { P3 } from "vermeer-ui";

    let { user, children }: { user?: User, children?: Snippet<[]> } = $props();
</script>

<div class="user-display">
    <Avatar target={user} size={80} />
    <P3>{user?.username}</P3>
    {@render children?.()}
</div>

<style>
    .user-display {
      width: 320px;
      height: 180px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      border: 2px solid var(--textDim);
      border-radius: var(--borderRadius, 3px);
      background-color: var(--bgMain);
    }
</style>