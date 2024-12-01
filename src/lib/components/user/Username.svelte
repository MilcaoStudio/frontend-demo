<script lang="ts">
    import type { User } from "$lib/uprising.js";
    import Icon from "@iconify/svelte";
    import { IconButton, P3 } from "vermeer-ui";

    let { user }: { user: User } = $props();
</script>

<div style:display="inline-flex" style:place-items="center">
    <P3 color="var(--textMain)" class="username">
        {user.displayName ?? user.username}
    </P3>
    <IconButton isSmall onclick={()=>navigator && navigator.clipboard.writeText(user.id)}>
        <Icon icon="bx:copy" />
    </IconButton>
</div>

<style>
    :global(.username) {
        margin: 0;
    }
</style>