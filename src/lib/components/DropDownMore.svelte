<script lang="ts">
	import type { Snippet } from 'svelte';
	import { Icon } from '$lib/components';
	import { i18n } from '$lib/i18n';

	let {
		children,
		items = $bindable()
	}: {
		children: Snippet;
		items: any[];
	} = $props();

	let show: boolean = $state(false);
	let ref: HTMLElement | null = $state(null);

	const toggle = () => (show = !show);

	function onclick(e: MouseEvent) {
		if (!ref?.contains(e.target as Node)) show = false;
	}
</script>

<svelte:window {onclick} />

<div bind:this={ref} class="relative">
	<!--
		size-7 p-1.5 — те же размеры, что у соседних button-snippet'ов в
		Search. Без них кнопка получалась 24×24 (p-1 + иконка 16×16) и
		иконка визуально не выравнивалась с остальными 28×28 кнопками,
		хотя сам SVG не масштабируется.
	-->
	<button
		onclick={() => toggle()}
		class="click flex size-7 items-center justify-center rounded-md p-1.5 hover:bg-gray"
	>
		{@render children()}
	</button>
	{#if show}
		<div
			aria-label="cats-menu"
			role="group"
			class="absolute top-full left-0 z-3 mt-1 flex flex-col rounded-sm border border-gray bg-gray p-1 shadow-lg shadow-black/40"
		>
			{#each items as item, i (i)}
				<div class="flex w-full items-center gap-2 p-1 whitespace-nowrap select-none">
					<input
						bind:checked={item.check}
						aria-label={item.name}
						type="checkbox"
						class="click size-3.5 rounded-xs border-none text-accent"
					/>
					<button onclick={() => (item.check = !item.check)} class="click flex items-center gap-1">
						<Icon name={item.icon} />
						<p class="w-full text-sm">{i18n.t('category.' + item.name)}</p>
					</button>
				</div>
			{/each}
		</div>
	{/if}
</div>
