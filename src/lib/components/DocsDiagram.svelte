<script lang="ts">
	import { onMount } from 'svelte';
	import { Object, Link } from '$lib/components';
	import { runPhysicsLoop } from '$lib/functions/physics';
	import type { ITreeObject, ILink } from '$lib/interface';
	import type { DocArticle, DocLink } from '$lib/mocs/docs';

	let {
		articles,
		links,
		onSelect
	}: {
		articles: DocArticle[];
		links: DocLink[];
		onSelect: (slug: string) => void;
	} = $props();

	// Используем те же Object/Link, что и в боевом Canvas — пользователь
	// видит привычные круглые узлы, имена связей и стрелки. Drag,
	// context-menu, выделение и создание связей блокируются на уровне
	// обёртки (capture listener'ы), а навигация по клику обрабатывается
	// прозрачным overlay-ом поверх каждого узла.
	let container: HTMLDivElement | undefined = $state();
	let width = $state(800);
	let height = $state(500);
	let centerX = $derived(width / 2);
	let centerY = $derived(height / 2);
	let visible = $state(true);

	const objects: ITreeObject[] = $state(
		articles.map((a, i) => {
			const angle = (i / articles.length) * Math.PI * 2;
			return {
				id: a.id,
				name: a.title,
				type: a.type,
				parent: null,
				x: 400 + Math.cos(angle) * 180,
				y: 250 + Math.sin(angle) * 180,
				size: 100 * (a.mass ?? 1),
				mass: a.mass ?? 1,
				objects: [],
				links: []
			};
		})
	);
	const slugById: Map<number, string> = new Map(articles.map((a) => [a.id, a.slug]));
	const treeLinks: ILink[] = links.map((l) => ({ ...l }));

	onMount(() => {
		const c = container;
		if (!c) return;

		const ro = new ResizeObserver(() => {
			const rect = c.getBoundingClientRect();
			width = rect.width;
			height = rect.height;
		});
		ro.observe(c);
		const rect = c.getBoundingClientRect();
		width = rect.width;
		height = rect.height;

		// Блокируем все интерактивные события Object/Link в capture-фазе:
		// dragStore.setDrag не вызывается, контекстное меню не открывается,
		// inline-rename Link не запускается. Click пропускаем — overlay
		// ниже его обрабатывает (capture'ный stopPropagation внутри Object
		// нам не страшен, поскольку у overlay свой listener).
		const block = (e: Event) => {
			e.stopPropagation();
			e.preventDefault();
		};
		c.addEventListener('mousedown', block, true);
		c.addEventListener('contextmenu', block, true);
		c.addEventListener('dblclick', block, true);

		let wakeFn: (() => void) | null = null;
		const stopLoop = runPhysicsLoop({
			getObjects: () => objects,
			getLinks: () => treeLinks,
			getCenter: () => ({ x: centerX, y: centerY }),
			isPaused: () => !visible,
			onWakeSignal: (wake) => {
				wakeFn = wake;
				return () => {};
			}
		});

		const io = new IntersectionObserver((entries) => {
			const wasVisible = visible;
			visible = entries[0]?.isIntersecting ?? true;
			if (!wasVisible && visible) wakeFn?.();
		});
		io.observe(c);

		return () => {
			stopLoop();
			ro.disconnect();
			io.disconnect();
			c.removeEventListener('mousedown', block, true);
			c.removeEventListener('contextmenu', block, true);
			c.removeEventListener('dblclick', block, true);
		};
	});

	function nodeClick(id: number) {
		const slug = slugById.get(id);
		if (slug) onSelect(slug);
	}
</script>

<div bind:this={container} class="relative size-full overflow-hidden select-none">
	{#each objects as o (o.id)}
		<Object
			id={o.id}
			name={o.name}
			type={o.type}
			x={o.x}
			y={o.y}
			size={o.size}
			objects={o.objects ?? []}
			links={o.links ?? []}
			selParent={false}
			noArrows={false}
		/>
	{/each}
	{#each treeLinks as l (l.id)}
		{@const a = objects.find((o) => o.id === l.is)}
		{@const b = objects.find((o) => o.id === l.to)}
		{#if a && b}
			<Link id={l.id} name={l.name} type={l.type} is={a} to={b} isValue={false} toValue={true} />
		{/if}
	{/each}
	<!--
		Прозрачный overlay поверх узлов с собственным click-handler-ом —
		обрабатывает навигацию. mousedown/contextmenu/dblclick на этом же
		div заблокированы capture-listener-ом обёртки, поэтому drag не
		стартует и контекстное меню не открывается.
	-->
	{#each objects as o (o.id)}
		<button
			type="button"
			onclick={() => nodeClick(o.id)}
			aria-label={o.name}
			title={o.name}
			style="left: {o.x}px; top: {o.y}px; width: {o.size}px; height: {o.size}px; z-index: {Math.max(
				1,
				Math.abs(o.id)
			) + 1};"
			class="docs-overlay absolute cursor-pointer rounded-full"
		></button>
	{/each}
</div>

<style>
	/* Overlay поверх узла — невидимый, но кликабельный. При hover слегка
	   подсвечиваем для аффорданса. */
	.docs-overlay {
		background: transparent;
		border: 0;
		transition: background 0.15s;
	}
	.docs-overlay:hover {
		background: rgba(131, 92, 253, 0.18);
	}
</style>
