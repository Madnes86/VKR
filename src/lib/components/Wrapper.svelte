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

<div class="m-auto max-w-400 p-10 {className}">
	{@render children()}
</div>
