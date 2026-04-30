<script lang="ts">
	import { goto } from '$app/navigation';
	import { Header, Footer, BgSpace, DocsDiagram } from '$lib/components';
	import { docArticles, docLinks } from '$lib/mocs/docs';
	import { i18n } from '$lib/i18n';

	function open(slug: string) {
		void goto(`/docs/${slug}`);
	}
</script>

<Header />

<div class="relative isolate">
	<BgSpace />
	<section class="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-10">
		<div class="flex flex-col items-center gap-2 text-center">
			<h1>{i18n.t('docs.hero.h')}</h1>
			<p class="max-w-2xl opacity-80">{i18n.t('docs.hero.b')}</p>
		</div>
		<!-- Диаграмма документации: каждая статья — узел, связи между
		     ними показывают зависимость. Кликом на узел переходим к
		     соответствующей статье /docs/[slug]. -->
		<div
			class="relative mt-2 h-[640px] w-full overflow-hidden rounded-md border border-gray bg-black/30 backdrop-blur-xs"
		>
			<DocsDiagram articles={docArticles} links={docLinks} onSelect={open} />
		</div>
	</section>
</div>

<Footer />
