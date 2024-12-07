<script lang="ts">
    import { P3 } from "vermeer-ui";

    let { label, onchange, changeonkeyup = true, value, ...rest }: { label?: string, onchange: (value: string) => void, changeonkeyup?: boolean, value?: string|null } = $props();
</script>

{#if label}
    <P3 class="label">{label}</P3>
{/if}
<input type="text" {value} onchange={(e)=>onchange(e.currentTarget.value)} onkeyup={(e) => changeonkeyup && onchange(e.currentTarget.value)} {...rest} />

<style>
    :global(.label) {
        text-transform: uppercase;
    }

    input {
        font-size: 16px;
        background-color: var(--bgHighlight);
        color: var(--textMain);
        margin: 0;
        margin-top: 16px;
        border: none;
        height: 32px;
        border-radius: 8px;
        padding: 0;
    }
</style>
