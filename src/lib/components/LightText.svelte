<script lang="ts">
	import { searchStore } from '$lib/stores/search.svelte';
	// TODO: remove name Store;

	let {
		text
	}: {
		text: string;
	} = $props();

	let query: string = $derived(searchStore.get());

	// Сравнение регистронезависимое: и текст, и запрос lowercase-им
	// ОДНОВРЕМЕННО. Раньше lowercase-был только text — пользователь,
	// печатающий «Сер» и ожидающий найти «Сервис», получал промах,
	// потому что "сервис".includes("Сер") === false. Индексы в
	// lowercase-строке совпадают с оригинальными (toLowerCase
	// сохраняет длину для русских букв и базовой латиницы), поэтому
	// их можно использовать для подсветки исходных символов в шаблоне.
	let match = $derived.by(() => {
		const q = (query ?? '').toLowerCase();
		if (!q) return { start: -1, end: -1 };
		const n = text.toLowerCase();
		const start = n.indexOf(q);
		if (start < 0) return { start: -1, end: -1 };
		return { start, end: start + q.length };
	});
</script>

<!-- TODO: md use global searchStore? -->
<!-- TODO: styles migration -->

<span class="inline">
	{#each text as symbol, i}
		{@const isMatch = i >= match.start && i < match.end}
		{@const isFirst = i === match.start}
		{@const isLast = i === match.end - 1}
		<span class="{isMatch && 'is-match bg-accent'} {isFirst && 'rounded-l'} {isLast && 'rounded-r'}"
			>{symbol}</span
		>
	{/each}
</span>

<style>
	.rounded-l {
		border-top-left-radius: 0.25em;
		border-bottom-left-radius: 0.25em;
	}
	.rounded-r {
		border-top-right-radius: 0.25em;
		border-bottom-right-radius: 0.25em;
	}
	.is-match {
		margin: 0 -0.5px;
	}
</style>
