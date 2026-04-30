<script lang="ts">
	import { Icon } from '$lib/components';
	import { contextStore } from '$lib/stores/context.svelte';
	import { objects } from '$lib/stores/objects.svelte';
	import { i18n } from '$lib/i18n';

	let x: number = $derived(contextStore.x - 15);
	let y: number = $derived(contextStore.y - 15);
	let menu: HTMLInputElement | null = $state(null);
	let id = $derived(contextStore.data.id);
	let o = $derived(objects.get(id));
	let type = $derived(o.type);

	function onclick(e: MouseEvent) {
		if (contextStore.isOpen && !menu.contains(e.target as Node)) {
			contextStore.close();
		}
	}
	function create() {
		// id=0 — клиентский sentinel «корень», на сервере его не бывает.
		const p = contextStore.data?.id;
		objects.create({
			name: 'test',
			type: 'default',
			parent: p && p > 0 ? p : null
		});
	}
	const defaultType = () => objects.updateType(id, 'default');
	const interfaceType = () => objects.updateType(id, 'interface');
	const optionalType = () => objects.updateType(id, 'optional');
	const remove = () => objects.remove(id);
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
	>
		{@render button('add', i18n.t('context.addObject'), create)}
		{#if id > 0}
			{#if type !== 'default'}
				{@render button('object', i18n.t('context.defaultType'), defaultType)}
			{/if}
			{#if type !== 'interface'}
				{@render button('interface', i18n.t('context.interfaceType'), interfaceType)}
			{/if}
			{#if type !== 'optional'}
				{@render button('optional', i18n.t('context.optionalType'), optionalType)}
			{/if}
			{@render button('delete', i18n.t('context.remove'), remove, 'red')}
		{/if}
	</div>
{/if}
