<script lang="ts">
	import type { Snippet } from "svelte";

    let {
        children,
        className,
    } : {
        children: Snippet;
        className?: string;
    } = $props();

</script>

<div class="flex flex-col p-4 gap-4 w-180 rounded-md border backdrop-blur-[2px] border-gray bg-gray-glass {className}">
    {@render children()}
</div>