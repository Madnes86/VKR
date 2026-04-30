<script lang="ts">
	import { searchStore } from '$lib/stores/search.svelte';
	import { Icon } from '$lib/components';
	import { objectValidation } from '$lib/functions/other';
	import { categoryes } from '$lib/mocs/categoryes';
	import { notificationStore } from '$lib/stores/notification.svelte';
	import type { ICategory } from '$lib/interface';
	import DropDownMore from './DropDownMore.svelte';
	import { i18n } from '$lib/i18n';

	let {
		onSearch
	}: {
		onSearch?: () => void;
	} = $props();

	let v: string = $state('');
	let cats: ICategory[] = $state(categoryes);
	let global: boolean = $derived(cats[0].check);
	let stroke = $derived(global ? 'var(--color-accent)' : '#FFF');
	let selected: Omit<ICategory, 'icon'>[] = $derived(
		cats.filter((c) => c.check).map(({ name, check }) => ({ name, check }))
	);
	let placeholder = $derived(i18n.t('search.placeholder'));
	const MAX_LENGTH = 64;

	// Дебаунс реактивного обновления searchStore. Подписаны Tree,
	// Canvas, Name и др. — каждый keystroke запускал каскад derived/
	// rerender'ов и UI зависал на больших диаграммах. apply()/clear()
	// идут мимо дебаунса, чтобы Enter и крестик отрабатывали мгновенно.
	const DEBOUNCE_MS = 150;
	let debounceTimer: ReturnType<typeof setTimeout> | undefined;

	function flushPending() {
		if (debounceTimer !== undefined) {
			clearTimeout(debounceTimer);
			debounceTimer = undefined;
		}
	}

	$effect(() => {
		const newV = objectValidation(v);

		if (newV.length > 64) {
			notificationStore.error(i18n.t('search.invalid'), 'error');
			return;
		}
		flushPending();
		const sel = selected;
		debounceTimer = setTimeout(() => {
			searchStore.set(newV, sel);
			debounceTimer = undefined;
		}, DEBOUNCE_MS);
	});

	function search() {
		const newV = objectValidation(v);

		if (newV.length > 64) return notificationStore.error(i18n.t('search.invalid'), 'error');

		flushPending();
		// searchStore.set уже выставит applied=false если строка изменилась.
		// apply() переключает store в режим фильтра — узлы не матчащие
		// запрос исчезнут из Tree/Entityes/Canvas.
		searchStore.set(newV, selected);
		searchStore.apply();
		onSearch?.();
	}
	function clear() {
		v = '';
		flushPending();
		// Полный сброс: и query, и applied. После clear все элементы
		// снова видны без подсветки.
		searchStore.clear();
		searchStore.set('', selected);
	}
</script>

<div class="flex w-full items-center gap-2 p-2">
	{#snippet button(name: string, onclick: () => void, stroke?: string)}
		<button {onclick} aria-label={name} class="click size-7 rounded-md p-1.5 hover:bg-gray">
			<Icon {name} {stroke} />
		</button>
	{/snippet}
	{@render button('global', () => (cats[0].check = !cats[0].check), stroke)}
	<input
		bind:value={v}
		{placeholder}
		type="text"
		maxlength={MAX_LENGTH}
		onkeydown={(e) => {
			if (e.key === 'Enter') {
				e.preventDefault();
				search();
			}
		}}
		class="w-full border-none bg-transparent p-0 text-lg"
	/>
	{#if v.length > 2}
		{@render button('cross', clear)}
	{/if}
	<DropDownMore items={cats}>
		<Icon name="category" />
	</DropDownMore>
	{@render button('search', search)}
</div>
