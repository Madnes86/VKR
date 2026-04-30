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
		// Shift / Cmd / Ctrl + click — toggle вхождения в группу. parent
		// тянем из flat-стора; для связей групповые операции не
		// предусмотрены — фолбэк на одиночный select.
		if ((e.shiftKey || e.metaKey || e.ctrlKey) && type === 'o') {
			const parent = objects.get(id)?.parent ?? null;
			selectedStore.toggleAtLevel(data, parent);
			return;
		}
		selectedStore.set('selected', data);
	}
	const toggle = () => (state = !state);

	// Drag-source.
	// - Если строка входит в multi-выделение → тянем всю группу
	//   (включая саму строку);
	// - Если строка НЕ в группе, но multi пустое или из одного → тянем
	//   именно эту строку (не «прицепляем» постороннюю группу к чужому
	//   объекту — это бы удивило пользователя).
	// Связи (type='l') не draggable — dragstart возвращаем без payload.
	function ondragstart(e: DragEvent) {
		if (type !== 'o' || !e.dataTransfer) return;
		const inGroup = selectedStore.has(data) && selectedStore.count > 1;
		let ids: number[];
		if (inGroup) {
			ids = Array.from(selectedStore.multi)
				.filter((k) => k.startsWith('o + '))
				.map((k) => Number.parseInt(k.slice(4), 10))
				.filter((n) => Number.isFinite(n));
		} else {
			ids = [id];
		}
		e.dataTransfer.effectAllowed = 'copy';
		e.dataTransfer.setData('application/x-structura-objects', JSON.stringify(ids));
	}

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
	{ondragstart}
	draggable={type === 'o'}
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
