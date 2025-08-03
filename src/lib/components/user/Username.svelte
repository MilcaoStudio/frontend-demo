<script lang="ts">
    import type { User } from "$lib/uprising.js";
    import { P3 } from "vermeer-ui";

    let { user, color }: { user: User, color?: string } = $props();
</script>

<div style:display="inline-flex" style:place-items="center">
    <P3 {color}>
        {user.displayName ?? user.username}
    </P3>
</div>