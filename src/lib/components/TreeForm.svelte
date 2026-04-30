<script lang="ts">
	import { tick } from 'svelte';
	import { Icon, LightText } from '$lib/components';
	import { selectedStore, viewStore, objects, links } from '$lib/stores/objects.svelte';
	import { pendingNameEdit } from '$lib/stores/pendingEdit.svelte';

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
	// Актуальное имя берём приоритетно из стора — после commit prop у
	// родителя мог не успеть прокрутиться (treeStore — derived). Так
	// строка моментально отражает результат.
	let displayName = $derived.by(() => {
		if (type === 'o') return objects.get(id)?.name ?? name;
		return links.get(id)?.name ?? name;
	});
	let editing: boolean = $state(false);
	let draft: string = $state(name);
	let inputEl: HTMLInputElement | undefined = $state();
	let icon: string = $derived.by(() => {
		if (type === 'o') {
			return more ? 'objects' : 'object';
		} else {
			return more ? 'lines' : 'line';
		}
	});

	// Если строка относится к свежесозданному объекту/связи — открываем
	// inline-edit автоматически, как Name.svelte и Link.svelte.
	$effect(() => {
		const kind = type === 'o' ? 'object' : 'link';
		if (pendingNameEdit.claim(id, kind)) {
			void openEdit();
		}
	});

	async function openEdit() {
		draft = displayName;
		editing = true;
		await tick();
		inputEl?.focus();
		inputEl?.select();
	}

	function commit() {
		const next = draft.trim();
		// Сохраняем при любом непустом значении, чтобы исключить race
		// с pendingNameEdit и не «съесть» правку при сравнении со
		// старым prop name (тот же фикс, что в Name/Link.svelte).
		if (next) {
			if (type === 'o') objects.update(id, { name: next });
			else links.update(id, { name: next });
		}
		editing = false;
	}

	function cancel() {
		draft = displayName;
		editing = false;
	}

	function onkeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			e.preventDefault();
			commit();
		} else if (e.key === 'Escape') {
			e.preventDefault();
			cancel();
		}
	}

	function toggle(e: MouseEvent) {
		e.stopPropagation();
		if (editing) commit();
		else void openEdit();
	}

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

	function remove(e: MouseEvent) {
		e.stopPropagation();
		if (editing) editing = false;
		if (type === 'o') objects.remove(id);
		else links.remove(id);
	}

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
		{#if editing}
			<input
				bind:this={inputEl}
				bind:value={draft}
				{onkeydown}
				onblur={commit}
				onclick={(e) => e.stopPropagation()}
				onmousedown={(e) => e.stopPropagation()}
				type="text"
				maxlength="64"
				class="h-6 w-full border-0 bg-transparent p-0 focus:outline-none"
			/>
		{:else}
			<LightText text={displayName} category={type === 'o' ? 'Objects' : 'Links'} />
		{/if}
	</button>
	{#if hover || editing}
		<button onclick={toggle} aria-label="rename" class="click rounded-sm p-1 hover:bg-gray">
			{#if editing}
				<Icon name="check" stroke="green" />
			{:else}
				<Icon name="edit" />
			{/if}
		</button>
	{/if}
	{#if hover && !editing}
		<button
			onclick={remove}
			aria-label="delete"
			class="click rounded-sm p-1 hover:bg-gray hover:text-red"
		>
			<Icon name="delete" stroke="red" />
		</button>
	{/if}
</div>
