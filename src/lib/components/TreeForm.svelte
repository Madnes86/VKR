<script lang="ts">
	import { Icon, LightText } from '$lib/components';
	import { selectedStore, viewStore, objects } from '$lib/stores/objects.svelte';

	let {
		id,
		name,
		type,
		more,
		query
	}: {
		id: number;
		name: string;
		type: 'o' | 'l';
		more?: boolean;
		query: string;
	} = $props();

	let data = $derived(`${type} + ${id}`);
	// Учитываем не только primary-selected, но и membership в группе:
	// иначе при Shift+click из дерева выделенные строки не подсвечивались.
	let selected: boolean = $derived(selectedStore.selected === data || selectedStore.has(data));
	let hover: boolean = $derived(selectedStore.hover === data);
	let state: boolean = $state(true);
	let icon: string = $derived.by(() => {
		if (type === 'o') {
			return more ? 'objects' : 'object';
		} else {
			return more ? 'lines' : 'line';
		}
	});

	const onmouseenter = () => selectedStore.set('hover', data);
	const onmouseleave = () => selectedStore.clear('hover');
	function onclick(e: MouseEvent) {
		// Shift+click — toggle вхождения в группу. parent тянем из
		// flat-стора; для связей групповые операции не предусмотрены —
		// фолбэк на одиночный select.
		if (e.shiftKey && type === 'o') {
			const parent = objects.get(id)?.parent ?? null;
			selectedStore.toggleAtLevel(data, parent);
			return;
		}
		selectedStore.set('selected', data);
	}
	const toggle = () => (state = !state);

	function ondblclick(e: MouseEvent) {
		if (type === 'l') return;
		e.stopPropagation();
		viewStore.set(id);
	}
</script>

<!-- TODO: rename -->
<!-- TODO: function toggle type -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	{ondblclick}
	{onmouseenter}
	{onmouseleave}
	data-testid="row"
	class={`${selected && 'border border-accent'} ${hover && 'outline-1 outline-accent'} m-1 flex w-full gap-2 rounded-sm`}
>
	<button {onclick} class="click flex w-full items-center gap-2 p-1">
		<Icon name={icon} />
		{#if state}
			<LightText text={name} />
		{:else}
			<input
				bind:value={name}
				type="text"
				class={`h-6 w-full border-0 bg-transparent p-0 focus:outline-none`}
			/>
		{/if}
	</button>
	{#if hover || !state}
		<button onclick={toggle} class="click rounded-sm p-1 hover:bg-gray">
			{#if state}
				<Icon name="edit" />
			{:else}
				<Icon name="check" stroke="green" />
			{/if}
		</button>
	{/if}
</div>
