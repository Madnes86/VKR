<script lang="ts">
	import type { Snippet } from "svelte";

    let {
        children
    } : {
        children: Snippet
    } = $props();

</script>

<div class="p-10">
    {@render children()}
</div>