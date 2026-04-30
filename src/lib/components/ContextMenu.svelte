<script lang="ts">
	import { Icon } from '$lib/components';
	import { contextStore } from '$lib/stores/context.svelte';
	import { objects } from '$lib/stores/objects.svelte';
	import { i18n } from '$lib/i18n';

	let x: number = $derived(contextStore.x - 15);
	let y: number = $derived(contextStore.y - 15);
	let menu: HTMLInputElement | null = $state(null);
	let id = $derived(contextStore.data?.id ?? 0);
	let o = $derived(objects.get(id));
	let type = $derived(o?.type ?? 'default');
	let isComponent = $derived(type === 'component');

	function onclick(e: MouseEvent) {
		if (contextStore.isOpen && menu && !menu.contains(e.target as Node)) {
			contextStore.close();
		}
	}

	// CRUD helper: каждое действие закрывает меню — пользователю не
	// нужно лишнее кликать мимо, чтобы продолжить работу.
	function withClose<A extends unknown[]>(fn: (...args: A) => void): (...args: A) => void {
		return (...args: A) => {
			fn(...args);
			contextStore.close();
		};
	}

	const create = withClose(() => {
		// id=0 — клиентский sentinel «корень», на сервере его не бывает.
		const p = contextStore.data?.id;
		objects.create({
			name: i18n.t('context.addObject'),
			type: 'default',
			parent: p && p > 0 ? p : null
		});
	});

	const defaultType = withClose(() => objects.updateType(id, 'default'));
	const interfaceType = withClose(() => objects.updateType(id, 'interface'));
	const optionalType = withClose(() => objects.updateType(id, 'optional'));
	const remove = withClose(() => objects.remove(id));

	const rename = withClose(() => {
		if (!o) return;
		const next = window.prompt(i18n.t('context.renamePrompt'), o.name);
		if (next === null) return;
		const trimmed = next.trim();
		if (!trimmed || trimmed === o.name) return;
		objects.update(id, { name: trimmed });
	});

	const duplicate = withClose(() => {
		if (!o) return;
		// Координаты не дублируем — physics сам разнесёт; клонируем суть.
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
		style="left: {x}px; top: {y}px"
		class="fixed z-1000 flex flex-col items-start gap-2 rounded-lg border border-white bg-gray-glass p-2 backdrop-blur-[4px]"
		data-testid="context-menu"
	>
		{@render button('add', i18n.t('context.addObject'), create)}
		{#if id > 0}
			{@render button('edit', i18n.t('context.rename'), rename)}
			{@render button('component', i18n.t('context.duplicate'), duplicate)}
			{#if isComponent}
				{@render button('component', i18n.t('context.unmarkComponent'), toggleComponent)}
			{:else}
				{@render button('component', i18n.t('context.markComponent'), toggleComponent)}
			{/if}
			{#if type !== 'default' && !isComponent}
				{@render button('object', i18n.t('context.defaultType'), defaultType)}
			{/if}
			{#if type !== 'interface' && !isComponent}
				{@render button('interface', i18n.t('context.interfaceType'), interfaceType)}
			{/if}
			{#if type !== 'optional' && !isComponent}
				{@render button('optional', i18n.t('context.optionalType'), optionalType)}
			{/if}
			{@render button('delete', i18n.t('context.remove'), remove, 'red')}
		{/if}
	</div>
{/if}
