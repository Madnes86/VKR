<script lang="ts">
	import { Icon } from '$lib/components';
	import { contextStore } from '$lib/stores/context.svelte';
	import { objects, links, selectedStore } from '$lib/stores/objects.svelte';
	import { i18n } from '$lib/i18n';

	let x: number = $derived(contextStore.x - 15);
	let y: number = $derived(contextStore.y - 15);
	let menu: HTMLDivElement | null = $state(null);
	let id = $derived(contextStore.id);
	let kind = $derived(contextStore.kind);
	let o = $derived(kind === 'object' ? objects.get(id) : undefined);
	let link = $derived(kind === 'link' ? links.get(id) : undefined);
	let type = $derived(o?.type ?? 'default');
	let isComponent = $derived(type === 'component');

	// Если правый клик пришёл на объект, входящий в multi-выделение
	// (>1 объект), показываем bulk-команды над всей группой.
	let dataKey = $derived(`o + ${id}`);
	let groupMode = $derived(
		kind === 'object' && selectedStore.count > 1 && selectedStore.has(dataKey)
	);
	let groupCount = $derived(selectedStore.count);

	// Извлекаем числовые id объектов из selectedStore.multi (он хранит
	// строковые ключи вида "o + 7").
	function selectedObjectIds(): number[] {
		const ids: number[] = [];
		for (const key of selectedStore.multi) {
			if (!key.startsWith('o + ')) continue;
			const n = Number.parseInt(key.slice(4), 10);
			if (Number.isFinite(n)) ids.push(n);
		}
		return ids;
	}

	function onclick(e: MouseEvent) {
		if (contextStore.isOpen && menu && !menu.contains(e.target as Node)) {
			contextStore.close();
		}
	}

	function withClose<A extends unknown[]>(fn: (...args: A) => void): (...args: A) => void {
		return (...args: A) => {
			fn(...args);
			contextStore.close();
		};
	}

	// ── Canvas / Object: создание и редактирование объектов ────────────────
	const create = withClose(() => {
		// При kind=object создаём ребёнка к этому объекту. id===0 — это
		// «виртуальный корень» buildTree-а, его в реальном сторе не
		// существует, поэтому отбрасываем именно 0. Tmp-id (отрицательные)
		// — нормальные клиентские объекты, ребёнка к ним создаём как и к
		// серверным.
		const parent = kind === 'object' && id !== 0 ? id : null;
		objects.create({ name: i18n.t('context.addObject'), type: 'default', parent });
	});

	const defaultType = withClose(() => objects.updateType(id, 'default'));
	const interfaceType = withClose(() => objects.updateType(id, 'interface'));
	const optionalType = withClose(() => objects.updateType(id, 'optional'));
	const removeObject = withClose(() => objects.remove(id));

	const renameObject = withClose(() => {
		if (!o) return;
		const next = window.prompt(i18n.t('context.renamePrompt'), o.name);
		if (next === null) return;
		const trimmed = next.trim();
		if (!trimmed || trimmed === o.name) return;
		objects.update(id, { name: trimmed });
	});

	const duplicate = withClose(() => {
		if (!o) return;
		objects.create({
			name: `${o.name} ${i18n.t('context.duplicateSuffix')}`,
			type: o.type,
			parent: o.parent,
			content: o.content
		});
	});

	const toggleComponent = withClose(() => {
		objects.updateType(id, isComponent ? 'default' : 'component');
	});

	// ── Link: переименовать / развернуть / удалить ─────────────────────────
	const renameLink = withClose(() => {
		if (!link) return;
		const next = window.prompt(i18n.t('context.renamePrompt'), link.name);
		if (next === null) return;
		const trimmed = next.trim();
		if (!trimmed || trimmed === link.name) return;
		links.update(id, { name: trimmed });
	});

	const flipLink = withClose(() => {
		if (!link) return;
		// Меняем местами is/to — направление стрелки разворачивается.
		links.update(id, {
			is: link.to,
			to: link.is,
			isValue: link.toValue,
			toValue: link.isValue
		});
	});

	const removeLink = withClose(() => links.remove(id));

	// ── Bulk-команды над выделенной группой ────────────────────────────────
	const bulkRemove = withClose(() => {
		for (const objId of selectedObjectIds()) objects.remove(objId);
		selectedStore.clearAll();
	});

	const bulkDuplicate = withClose(() => {
		const suffix = i18n.t('context.duplicateSuffix');
		for (const objId of selectedObjectIds()) {
			const obj = objects.get(objId);
			if (!obj) continue;
			objects.create({
				name: `${obj.name} ${suffix}`,
				type: obj.type,
				parent: obj.parent,
				content: obj.content
			});
		}
		selectedStore.clearAll();
	});
</script>

<svelte:window {onclick} />

{#snippet button(name: string, text: string, onclick: () => void, color?: string)}
	<button {onclick} class="click flex w-full gap-2 rounded-sm p-1 hover:bg-black">
		<Icon {name} stroke={color} />
		<p style="color: {color}">{text}</p>
	</button>
{/snippet}

{#if contextStore.isOpen}
	<div
		bind:this={menu}
		role="menu"
		style="left: {x}px; top: {y}px"
		class="fixed z-1000 flex flex-col items-start gap-2 rounded-lg border border-white bg-gray-glass p-2 backdrop-blur-xs"
		data-testid="context-menu"
		data-kind={kind}
	>
		{#if kind === 'canvas'}
			{@render button('add', i18n.t('context.addObject'), create)}
		{:else if kind === 'object' && groupMode}
			<!-- Bulk: правый клик пришёл на объект из группы выделения. -->
			<p class="px-1 text-xs opacity-60" data-testid="group-count">
				{i18n.t('context.groupSelected')}: {groupCount}
			</p>
			{@render button('component', i18n.t('context.bulkDuplicate'), bulkDuplicate)}
			{@render button('delete', i18n.t('context.bulkRemove'), bulkRemove, 'red')}
		{:else if kind === 'object'}
			{@render button('add', i18n.t('context.addChild'), create)}
			{@render button('edit', i18n.t('context.rename'), renameObject)}
			{@render button('component', i18n.t('context.duplicate'), duplicate)}
			{#if isComponent}
				{@render button('component', i18n.t('context.unmarkComponent'), toggleComponent)}
			{:else}
				{@render button('component', i18n.t('context.markComponent'), toggleComponent)}
			{/if}
			{#if !isComponent && type !== 'default'}
				{@render button('object', i18n.t('context.defaultType'), defaultType)}
			{/if}
			{#if !isComponent && type !== 'interface'}
				{@render button('interface', i18n.t('context.interfaceType'), interfaceType)}
			{/if}
			{#if !isComponent && type !== 'optional'}
				{@render button('optional', i18n.t('context.optionalType'), optionalType)}
			{/if}
			{@render button('delete', i18n.t('context.remove'), removeObject, 'red')}
		{:else if kind === 'link'}
			{@render button('edit', i18n.t('context.linkRename'), renameLink)}
			{@render button('forward', i18n.t('context.linkFlip'), flipLink)}
			{@render button('delete', i18n.t('context.linkRemove'), removeLink, 'red')}
		{/if}
	</div>
{/if}
