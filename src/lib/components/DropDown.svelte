<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		items,
		selectedItem = $bindable(),
		children,
		className
	}: {
		items: any[];
		selectedItem?: any;
		children: Snippet;
		className?: string;
	} = $props();

	let open: boolean = $state(false);
	let ref: HTMLElement | null = $state(null);

	const onclick = () => (open = !open);

	function selecting(item: any) {
		selectedItem = item;
	}
	function closeing(e: MouseEvent) {
		if (!ref?.contains(e.target as Node)) {
			open = false;
		}
	}
</script>

<svelte:body onclick={closeing} />

<div bind:this={ref} class="relative {className}">
	<button {onclick}>
		{@render children()}
	</button>

	{#if open}
		<div class="absolute top-10 left-0 z-2 flex flex-col gap-2 rounded-sm bg-gray p-2">
			{#each items as item}
				{#if item != selectedItem}
					<button onclick={() => selecting(item)} class="click rounded-sm px-1 hover:bg-gray"
						>{item}</button
					>
				{/if}
			{/each}
		</div>
	{/if}
</div>
