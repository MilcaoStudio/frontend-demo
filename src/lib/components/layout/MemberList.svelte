<script lang="ts">
  import Icon from "@iconify/svelte";
  import InputBox from "../input/InputBox.svelte";
  import Collapsable from "../Collapsable.svelte";
  import { getContext } from "svelte";
  import type { User } from "uprising.js";
  import MemberButton from "../user/MemberButton.svelte";
  function search(input: string) {
    console.debug("Searching for %s (Not implemented)", input);
  }
  const online: User[] = [getContext("user")];
  const offline: User[] = [];
</script>

<div class="memberSidebar">
  <div class="header">
    <InputBox onchange={search} />
    <div class="searchSubmit">
      <Icon icon="bx:search" width={24} color="var(--textMain)" />
    </div>
  </div>
  <Collapsable name="Online - {online.length}" open={online.length > 0}>
    {#each online as user}
      <MemberButton {user} />
    {/each}
  </Collapsable>
  <Collapsable name="Offline - {offline.length}">
    {#each offline as user}
      <MemberButton {user} />
    {/each}
  </Collapsable>
</div>

<style>
  .memberSidebar {
    background: var(--bgMain);
    box-shadow: 1px 5px 5px black;
    display: flex;
    flex-direction: column;
    margin: 8px;
    padding: var(--padding-m);
    border-radius: var(--borderRadius);
  }
  .header {
    display: flex;
    gap: 8px;
  }
  .searchSubmit {
    background-color: var(--bgHighlight);
    border-radius: var(--borderRadius);
    width: 32px;
    display: inline-flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
  }
</style>
