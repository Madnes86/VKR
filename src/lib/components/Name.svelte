<script lang="ts">
	import { tick } from 'svelte';
	import { Icon, LightText } from '$lib/components';
	import { searchStore } from '$lib/stores/search.svelte';
	import { objects } from '$lib/stores/objects.svelte';
	import { pendingNameEdit } from '$lib/stores/pendingEdit.svelte';
	import type { Snippet } from 'svelte';

	let {
		id,
		name,
		size,
		children
	}: {
		id: number;
		name: string;
		size: number;
		children?: Snippet;
	} = $props();

	let hover: boolean = $state(false);
	let read: boolean = $state(false);
	let draft: string = $state(name);
	let inputEl: HTMLInputElement | undefined = $state();
	let query: string = $derived(searchStore.get());

	// Гибрид UX: если id попал в pendingNameEdit (выставляется
	// ContextMenu.create), сразу открываем input при mount и выделяем
	// текст — пользователь печатает поверх дефолтного имени без
	// дополнительного клика. claim() одноразовый: повторное появление
	// объекта в DOM не откроет редактор.
	$effect(() => {
		if (pendingNameEdit.claim(id)) {
			startEdit();
		}
	});

	async function startEdit() {
		draft = name;
		read = true;
		await tick();
		inputEl?.focus();
		inputEl?.select();
	}

	function commit() {
		const next = draft.trim();
		// Сохраняем при любом непустом имени. Сравнение с prop `name`
		// раньше иногда «съедало» правку: при первом mount Name мог
		// получить name из прежнего рендера treeStore (race с
		// pendingNameEdit), и valid правка ошибочно считалась no-op.
		if (next) objects.update(id, { name: next });
		read = false;
	}

	function cancel() {
		draft = name;
		read = false;
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
		e.preventDefault();
		if (read) {
			commit();
		} else {
			void startEdit();
		}
	}

	const onmouseenter = () => (hover = true);
	const onmouseleave = () => (hover = false);
</script>

<div
	{onmouseenter}
	{onmouseleave}
	role="presentation"
	class="text-border absolute bottom-full left-1/2 flex -translate-x-1/2 text-center"
>
	<div class="flex items-center gap-2">
		{#if read}
			<input
				bind:this={inputEl}
				bind:value={draft}
				{onkeydown}
				onblur={commit}
				onclick={(e) => e.stopPropagation()}
				onmousedown={(e) => e.stopPropagation()}
				maxlength="64"
				style="font-size: {size / 5}px; height: {size / 4}px; line-height: {size /
					4}px; width: {Math.max(draft.length, 4) + 1}ch"
				type="text"
				class="text-border absolute bottom-full left-1/2 -translate-x-1/2 border-none bg-transparent p-0 text-center"
			/>
		{:else}
			<button
				onmousedown={toggle}
				style="font-size: {size / 5}px; height: {size / 4}px; line-height: {size / 4}px;"
				class="click text-border whitespace-nowrap select-none"
			>
				<LightText text={name} category="Objects" />
			</button>
			{#if hover}
				<button
					onmousedown={toggle}
					style="width: {size / 5}px; height: {size / 5}px"
					class="click absolute top-1/2 left-full -translate-y-1/2"
				>
					<Icon name="edit" />
				</button>
			{/if}
		{/if}
		{@render children?.()}
	</div>
</div>
