<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { Header, Footer, BgSpace, Icon } from '$lib/components';
	import type { PageData } from './$types';
	// EditorJS импортируем только как тип — сам пакет тянем динамически
	// из onMount, иначе SSR падает на «Element is not defined».
	import type EditorJSType from '@editorjs/editorjs';

	let { data }: { data: PageData } = $props();

	let holder: HTMLDivElement | undefined = $state();
	let editor: EditorJSType | undefined;

	onMount(async () => {
		if (!holder) return;
		const [E, H, L, M, IC] = await Promise.all([
			import('@editorjs/editorjs'),
			import('@editorjs/header'),
			import('@editorjs/list'),
			import('@editorjs/marker'),
			import('@editorjs/inline-code')
		]);
		editor = new E.default({
			holder,
			data: data.article.content,
			readOnly: true,
			minHeight: 0,
			tools: {
				header: { class: H.default as any, inlineToolbar: false },
				list: { class: L.default as any, inlineToolbar: false },
				marker: { class: M.default as any },
				inlineCode: { class: IC.default as any }
			}
		});
	});

	onDestroy(() => {
		editor?.destroy?.();
	});
</script>

<Header />

<div class="relative isolate">
	<BgSpace />
	<section class="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-10">
		<a
			href="/docs"
			class="click flex w-fit items-center gap-2 rounded-sm px-2 py-1 text-sm opacity-70 hover:bg-gray hover:opacity-100"
		>
			<span class="rotate-180"><Icon name="forward" /></span>
			К диаграмме
		</a>

		<article class="rounded-md border border-gray bg-black/40 px-6 py-6 backdrop-blur-xs sm:px-10">
			<h1 class="mb-4">{data.article.title}</h1>
			<div bind:this={holder} class="docs-article-host text-md leading-relaxed"></div>
		</article>
	</section>
</div>

<Footer />

<style>
	/* EditorJS render в read-only кладёт служебные пустые тулбары —
	   глушим их, чтобы статья выглядела как обычный документ. */
	:global(.docs-article-host .ce-toolbar),
	:global(.docs-article-host .ce-toolbar__plus),
	:global(.docs-article-host .ce-toolbar__settings-btn) {
		display: none !important;
	}
	:global(.docs-article-host .codex-editor__redactor) {
		padding-bottom: 0 !important;
	}
	:global(.docs-article-host h2) {
		font-size: 1.5rem;
		margin-top: 1rem;
		margin-bottom: 0.5rem;
	}
	:global(.docs-article-host h3) {
		font-size: 1.2rem;
		margin-top: 0.8rem;
		margin-bottom: 0.4rem;
	}
	:global(.docs-article-host .cdx-list) {
		padding-left: 1.4rem;
		list-style: disc;
	}
	:global(.docs-article-host .cdx-list__item) {
		margin: 0.2rem 0;
	}
	:global(.docs-article-host p) {
		margin: 0.5rem 0;
	}
</style>
