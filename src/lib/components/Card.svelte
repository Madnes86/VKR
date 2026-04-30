<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		children,
		className
	}: {
		children: Snippet;
		className?: string;
	} = $props();
</script>

<div
	class="flex w-180 flex-col gap-4 rounded-md border border-gray bg-gray-glass p-4 backdrop-blur-[2px] {className}"
>
	{@render children()}
</div>
