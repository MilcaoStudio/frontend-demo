<script>
    import { state } from "$lib";
    import { Modal } from "vermeer-ui";
    import InputBox from "../input/InputBox.svelte";
    let { user, ...rest } = $props();
    let settings = state.accounts.getAccount(user.id)?.current;
    let username = $derived(settings?.username);
    let displayName = $derived(settings?.displayName ?? null);
</script>

{#if settings}
   <Modal title="Modify User" {...rest} >
    <InputBox label="Username" value={username} onchange={(value) => settings.username = value} />
    <InputBox label="Display name" value={displayName} onchange={(value) => settings.displayName = value} />
</Modal>
{:else}
    <Modal title="Error" />
{/if}
