<script>
  import { server, users } from "$lib";
  import ChannelList from "$lib/components/layout/ChannelList.svelte";
  import MemberList from "$lib/components/layout/MemberList.svelte";
  import UserArea from "$lib/components/layout/UserArea.svelte";
  import { User } from "uprising.js";
  import { voiceState } from "$lib/voice/VoiceState.svelte";
  import { onMount, setContext } from "svelte";
  import { ulid } from "ulid";
  import { StatusMode } from "$lib/uprising.js/API";

  let userId = ulid();
  let user = User.create({
    id: userId,
    username: userId,
    display_name: userId,
    status: { mode: StatusMode.ONLINE, text: "Playing Metro Exodus" },
  });
  users.set(userId, user);
  setContext("user", user);
  onMount(() => {
    voiceState
      .loadVoice()
      .then(() => voiceState.connect(userId))
      .catch((err) => console.error(err));
    return voiceState.disconnect; // bound function
  });
</script>

<div class="mainContainer">
  <div class="leftSidebar">
    <ChannelList {server} />
    <UserArea {user} />
  </div>
  <slot />
  <MemberList />
</div>

<style>
  .leftSidebar {
    width: 350px;
    display: flex;
    flex-direction: column;
    padding: 8px;
  }

  .mainContainer {
    display: flex;
    height: 100svh;
    overflow: auto;
  }
</style>
