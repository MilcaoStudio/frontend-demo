<script>
  import ModalRenderer from "$lib/components/modal/ModalRenderer.svelte";
  import "../global.css";
  let { children } = $props();
</script>

<div id="main">
  {@render children()}
</div>
<ModalRenderer />

<style>
  #main {
    background: var(--bgMain);
    color: var(--textMain);
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
  }
</style>
