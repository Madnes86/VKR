<script lang="ts">
	/**
	 * Entityes — пул компонентов проекта (объекты с type==='component').
	 * Поиск работает в двух режимах:
	 *   - applied=false: список не урезается, LightText в TreeForm
	 *     подсвечивает совпадения по подстроке.
	 *   - applied=true: список схлопывается до элементов, имя которых
	 *     матчит запрос. Без applied кнопка поиска ничего не делает,
	 *     это и есть режим «найти, не отрезая контекст».
	 */
	import { TreeForm } from '$lib/components';
	import { objects } from '$lib/stores/objects.svelte';
	import { searchStore } from '$lib/stores/search.svelte';

	const components = $derived(objects.all.filter((o) => o.type === 'component'));

	const query = $derived(searchStore.get().toLowerCase().trim());

	const visibleComponents = $derived.by(() => {
		if (!searchStore.applied || !query) return components;
		return components.filter((c) => (c.name ?? '').toLowerCase().includes(query));
	});
</script>

<div class="flex w-full flex-col gap-1 p-1">
	{#if components.length === 0}
		<p class="p-2 text-sm opacity-60">
			Пул пуст. Компонентом становится сущность, упомянутая в тексте больше одного раза, либо
			помеченная вручную.
		</p>
	{:else if visibleComponents.length === 0}
		<p class="p-2 text-sm opacity-60">
			Ничего не найдено по запросу «{searchStore.get()}». Сбросьте поиск, чтобы вернуть полный
			список.
		</p>
	{:else}
		{#each visibleComponents as c (c.id)}
			<TreeForm id={c.id} name={c.name} type="o" more={false} {query} />
		{/each}
	{/if}
</div>
