<script lang="ts">
	import { goto } from '$app/navigation';
	import { Header, BgSpace, DocsDiagram } from '$lib/components';
	import { docArticles, docLinks } from '$lib/mocs/docs';
	import { i18n } from '$lib/i18n';

	function open(slug: string) {
		void goto(`/docs/${slug}`);
	}
</script>

<Header />

<!-- Полноэкранная диаграмма документации: занимает весь viewport под
     Header, fixed-overlay с Hero текстом висит сверху-слева, чтобы не
     перекрывать узлы по центру. Footer для этой страницы не нужен —
     навигация и так есть в Header. -->
<div class="relative h-[calc(100vh-3.5rem)] w-full overflow-hidden">
	<BgSpace />
	<div class="absolute inset-0">
		<DocsDiagram articles={docArticles} links={docLinks} onSelect={open} />
	</div>
	<div
		class="pointer-events-none absolute top-6 left-6 z-2 max-w-md rounded-md border border-gray bg-gray-glass p-4 backdrop-blur-xs"
	>
		<h1 class="mb-1 text-2xl">{i18n.t('docs.hero.h')}</h1>
		<p class="text-sm opacity-80">{i18n.t('docs.hero.b')}</p>
		<p class="mt-2 text-xs opacity-60">Кликните по статье на диаграмме, чтобы прочитать.</p>
	</div>
</div>
