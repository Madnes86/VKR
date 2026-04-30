<script lang="ts">
	import { searchStore } from '$lib/stores/search.svelte';

	let {
		text,
		// Категория, к которой относится этот текст (передают
		// родители: Object→Name → 'Objects', Link → 'Links', и т.д.).
		// Если ни одна категория не отмечена в Search — подсвечиваем
		// все. Если отмечены конкретные — только те, что входят.
		category
	}: {
		text: string;
		category?: string;
	} = $props();

	let query: string = $derived(searchStore.get());
	let categoryActive = $derived(category ? searchStore.matchesCategory(category) : true);

	// Сравнение регистронезависимое: и текст, и запрос lowercase-им
	// ОДНОВРЕМЕННО. Раньше lowercase-был только text — пользователь,
	// печатающий «Сер» и ожидающий найти «Сервис», получал промах,
	// потому что "сервис".includes("Сер") === false. Индексы в
	// lowercase-строке совпадают с оригинальными (toLowerCase
	// сохраняет длину для русских букв и базовой латиницы), поэтому
	// их можно использовать для подсветки исходных символов в шаблоне.
	let parts = $derived.by(() => {
		const q = (query ?? '').toLowerCase();
		if (!q || !categoryActive) return { before: text, match: '', after: '' };
		const n = text.toLowerCase();
		const start = n.indexOf(q);
		if (start < 0) return { before: text, match: '', after: '' };
		const end = start + q.length;
		return { before: text.slice(0, start), match: text.slice(start, end), after: text.slice(end) };
	});
</script>

<!--
	Раньше каждый символ выводился отдельным <span> через {#each text}.
	На больших диаграммах это давало сотни span-ов, перерисовываемых
	на каждое нажатие в поиске — UI заметно зависал. Теперь рендерим
	максимум 3 узла (до матча / матч / после), а если матча нет — текст
	вообще без обёрток. Подсветка визуально та же.
-->
<span class="inline"
	>{parts.before}{#if parts.match}<span class="is-match bg-accent">{parts.match}</span
		>{/if}{parts.after}</span
>

<style>
	.is-match {
		border-radius: 0.25em;
		margin: 0 -0.5px;
	}
</style>
