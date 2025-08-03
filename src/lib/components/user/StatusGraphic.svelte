<script lang="ts">
  import type { StatusMode } from "$lib/uprising.js/API";

  let {
    status,
    size = 5,
    offset = 27,
  }: { status: StatusMode; size?: number; offset?: number } = $props();
</script>

<circle cx={offset} cy={offset} r={size} fill="var(--status-{status})" />
