<script lang="ts">
	import { onMount } from 'svelte';
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

	// Локальная физическая модель — упрощённая копия поведения Canvas:
	// узел держится около центра, связанные тянутся друг к другу,
	// несвязанные расходятся. Object/Link не используем — у них много
	// логики (drag, выделение, контекстное меню), для read-only docs
	// диаграммы это лишнее.
	let container: HTMLDivElement | undefined = $state();
	let width = $state(800);
	let height = $state(500);
	let centerX = $derived(width / 2);
	let centerY = $derived(height / 2);
	let visible = $state(true);

	const objects: ITreeObject[] = $state(
		articles.map((a, i) => ({
			id: a.id,
			name: a.title,
			type: a.type,
			parent: null,
			x: width / 2 + Math.cos((i / articles.length) * Math.PI * 2) * 100,
			y: height / 2 + Math.sin((i / articles.length) * Math.PI * 2) * 100,
			size: 80 * (a.mass ?? 1),
			mass: a.mass ?? 1,
			objects: [],
			links: []
		}))
	);
	const slugById: Map<number, string> = new Map(articles.map((a) => [a.id, a.slug]));
	const treeLinks: ILink[] = links.map((l) => ({ ...l }));

	let hoveredId: number | null = $state(null);

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
		};
	});

	function nodeClick(id: number) {
		const slug = slugById.get(id);
		if (slug) onSelect(slug);
	}
</script>

<div bind:this={container} class="relative size-full select-none">
	<!-- SVG для связей: уходят за узлы (z-0). Стрелка target — это
	     обычное обозначение зависимости. -->
	<svg class="pointer-events-none absolute top-0 left-0 size-full">
		<defs>
			<marker
				id="docs-arrow"
				viewBox="0 0 10 10"
				refX="8"
				refY="5"
				markerWidth="5"
				markerHeight="5"
				orient="auto"
			>
				<path d="M 0 0 L 10 5 L 0 10 z" fill="white" opacity="0.5" />
			</marker>
		</defs>
		{#each treeLinks as l (l.id)}
			{@const a = objects.find((o) => o.id === l.is)}
			{@const b = objects.find((o) => o.id === l.to)}
			{#if a && b}
				{@const ax = a.x + a.size / 2}
				{@const ay = a.y + a.size / 2}
				{@const bx = b.x + b.size / 2}
				{@const by = b.y + b.size / 2}
				{@const dx = bx - ax}
				{@const dy = by - ay}
				{@const dist = Math.hypot(dx, dy) || 1}
				{@const sx = ax + (dx / dist) * (a.size / 2)}
				{@const sy = ay + (dy / dist) * (a.size / 2)}
				{@const ex = bx - (dx / dist) * (b.size / 2)}
				{@const ey = by - (dy / dist) * (b.size / 2)}
				<line
					x1={sx}
					y1={sy}
					x2={ex}
					y2={ey}
					stroke="white"
					stroke-opacity="0.4"
					stroke-width={Math.max(1.5, (a.size + b.size) / 100)}
					stroke-linecap="round"
					stroke-dasharray={l.type === 'default' ? '0' : '8 8'}
					marker-end="url(#docs-arrow)"
				/>
			{/if}
		{/each}
	</svg>
	{#each objects as o (o.id)}
		<button
			type="button"
			onclick={() => nodeClick(o.id)}
			onmouseenter={() => (hoveredId = o.id)}
			onmouseleave={() => (hoveredId === o.id ? (hoveredId = null) : null)}
			style="left: {o.x}px; top: {o.y}px; width: {o.size}px; height: {o.size}px; font-size: {o.size /
				6}px;"
			class="absolute flex cursor-pointer items-center justify-center rounded-full border-2 bg-black p-2 text-center transition-all
				{hoveredId === o.id
				? 'border-accent text-accent shadow-lg shadow-accent/40'
				: 'border-white text-white'}"
		>
			<span class="select-none">{o.name}</span>
		</button>
	{/each}
</div>
