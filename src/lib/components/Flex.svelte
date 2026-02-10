<script lang="ts">
	import type { Snippet } from "svelte";

    let {
        col,
        className,
        children
    } : {
        col?: boolean
        className?: string
        children: Snippet
    } = $props();
</script>

<div class={["flex w-full items-center", col && "flex-col", className]}>
    {@render children()}
</div>