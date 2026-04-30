<script lang="ts">
	import { TreeItem } from '$lib/components';
	import { treeStore, objects } from '$lib/stores/objects.svelte';
	import { searchStore } from '$lib/stores/search.svelte';
	import { flatTree } from '$lib/functions/other';
	import { computeSearchVisibility, pruneTree } from '$lib/functions/search';

	// Видимость в режиме фильтра: включается только когда нажата
	// кнопка поиска (searchStore.applied) и есть непустой запрос.
	// В режиме реактивной подсветки (просто ввод) — null, и дерево
	// рисуется целиком.
	let visibility = $derived.by(() => {
		const q = searchStore.get().trim();
		if (!searchStore.applied || !q) return null;
		return computeSearchVisibility(objects.all, q);
	});

	let prunedRoot = $derived(visibility ? pruneTree(treeStore.all, visibility) : treeStore.all);

	const root = $derived(prunedRoot.id);
	// Тип ITreeObject имеет objects?: ITreeObject[], а TreeItem ждёт
	// IObject[] — структурно совместимо, но TS требует cast.
	const currentObj = $derived((prunedRoot.objects ?? []) as any);
	const links = $derived(prunedRoot.links ?? []);

	// Подсветка по поиску и категориям — продолжает работать в обоих
	// режимах: при applied=false подсветка показывает совпадения внутри
	// полного дерева; при applied=true фильтрует видимое + всё ещё
	// подсвечивает фрагмент строки.
	let highlightedIds = $derived.by(() => {
		const query = searchStore.get().toLowerCase().trim();
		const cats = searchStore.cats;
		const all = objects.all;

		const isWeak = cats.find((c) => c.name === 'optional')?.check;
		const isLocal = cats.find((c) => c.name === 'Local search')?.check;
		const local = flatTree(treeStore.all);

		if (!query && !isWeak && !isLocal) {
			return { ids: new Set<number>(), query: '' };
		}

		const filtered = all.filter((e) => {
			const matchesQuery = !query || e.name.toLowerCase().includes(query);
			let matchesCat = true;
			if (isWeak && isLocal) matchesCat = e.type === 'optional' && local.has(e.id);
			else if (isWeak) matchesCat = e.type === 'optional';
			else if (isLocal) matchesCat = local.has(e.id);
			return matchesQuery && matchesCat;
		});

		return { ids: new Set(filtered.map((e) => e.id)), query };
	});
</script>

<div class="flex w-full flex-col border-gray p-1">
	{#if currentObj.length === 0}
		<p class="p-2 text-sm opacity-60">
			Дерево пусто, добавьте элементы или сгенерируйте диаграмму.
		</p>
	{:else}
		<TreeItem id={root} objects={currentObj} {links} {highlightedIds} />
	{/if}
</div>
