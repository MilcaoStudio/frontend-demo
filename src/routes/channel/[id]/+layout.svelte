<script>
    import { server, users } from "$lib";
    import ChannelList from "$lib/components/layout/ChannelList.svelte";
    import MemberList from "$lib/components/layout/MemberList.svelte";
    import UserArea from "$lib/components/layout/UserArea.svelte";
    import { StatusMode, User } from "uprising.js";
    import { voiceState } from "$lib/voice/VoiceState";
    import { onMount, setContext } from "svelte";
    import { ulid } from "ulid";
    import ModalRenderer from "$lib/components/modal/ModalRenderer.svelte";
    import { base } from "$app/paths";

    let userId = ulid();
    let user = User.create({id: userId, avatar: `${base}/avatars/1.png`, username: userId, display_name: userId, status: {mode: StatusMode.ONLINE, text: "Playing Metro Exodus"}});
    users.set(userId, user);
    setContext("user", user);
    onMount(() => {
        voiceState
            .loadVoice()
            .then(() => voiceState.connect(userId))
            .catch((err) => console.error(err));
    });
</script>

<div class="main">
    <div class="leftSidebar">
        <ChannelList {server} />
        <UserArea {user} />
    </div>
    <slot />
    <MemberList />
</div>
<ModalRenderer />

<style>
    .main {
        width: 100vw;
        height: 100vh;
        display: flex;
        background: var(--bgMain);
        color: var(--textMain);
    }

    .leftSidebar {
        width: 350px;
        display: flex;
        flex-direction: column;
        padding: 8px;
    }
</style>
