<script lang="ts">
	import type { Snippet } from "svelte";

    let {
        col,
        className,
        children,
        style
    } : {
        col?: boolean
        className?: string
        children: Snippet
        style?: string
    } = $props();
</script>

<div {style} class={["flex w-full items-center gap-2", col && "flex-col", className]}>
    {@render children()}
</div>