<script lang="ts">
  import { P4 } from "vermeer-ui";
  import Avatar from "../Avatar.svelte";
  import Username from "./Username.svelte";
  import Clickable from "../Clickable.svelte";
  import type { User } from "uprising.js";
  let { user }: { user: User } = $props();
  let statusDiplay = $state<"border" | "icon">("icon");
</script>

<Clickable
  onclick={() => {
    console.log("Show profile for %s", user.id);
  }}
>
  <div class="userButton">
    <Avatar
      size={32}
      target={user}
      withBorder={statusDiplay == "border"}
      withGraphic={statusDiplay == "icon"}
    />
    <div>
      <Username {user} />
      <P4 class="status">{user.status.text}</P4>
    </div>
  </div>
</Clickable>

<style>
  .userButton {
    display: flex;
    gap: 8px;
    padding: 4px 8px;
    border-radius: var(--borderRadiusOuter);
    border: 1px solid transparent;
    text-align: left;
  }
  .userButton:hover {
    border-color: var(--textDim);
    background-color: var(--bgSecondary);
  }
</style>
