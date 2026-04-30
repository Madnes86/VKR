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

		// Блокируем интерактивные события Object/Link в capture-фазе,
		// но ПРОПУСКАЕМ события, чей target — наш overlay-handle.
		// Иначе capture-block тушил mousedown на overlay раньше, чем
		// до него доходил bubble — и drag/click ничего не делали.
		const blockExceptOverlay = (e: Event) => {
			const t = e.target as HTMLElement | null;
			if (t?.closest('.docs-overlay')) return;
			e.stopPropagation();
			e.preventDefault();
		};
		c.addEventListener('mousedown', blockExceptOverlay, true);
		c.addEventListener('contextmenu', blockExceptOverlay, true);
		c.addEventListener('dblclick', blockExceptOverlay, true);

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
			c.removeEventListener('mousedown', blockExceptOverlay, true);
			c.removeEventListener('contextmenu', blockExceptOverlay, true);
			c.removeEventListener('dblclick', blockExceptOverlay, true);
		};
	});

	// Локальный drag для overlay-узлов. Глобальный dragStore нам не
	// подходит: он живёт в основном Canvas и поднял бы там состояние.
	// Отслеживаем суммарное смещение от mousedown — если оно меньше
	// CLICK_THRESHOLD, mouseup трактуется как навигация (click), иначе
	// как завершение drag и навигация подавляется.
	const CLICK_THRESHOLD_PX = 4;
	let dragId: number | null = null;
	let dragOffset: { x: number; y: number } = { x: 0, y: 0 };
	let dragMoved = 0;

	function onNodeMouseDown(e: MouseEvent, obj: ITreeObject) {
		if (e.button !== 0) return;
		e.preventDefault();
		e.stopPropagation();
		dragId = obj.id;
		dragOffset = { x: e.clientX - obj.x, y: e.clientY - obj.y };
		dragMoved = 0;
		window.addEventListener('mousemove', onWindowMove);
		window.addEventListener('mouseup', onWindowUp);
	}
	function onWindowMove(e: MouseEvent) {
		if (dragId === null) return;
		const obj = objects.find((o) => o.id === dragId);
		if (!obj) return;
		const nx = e.clientX - dragOffset.x;
		const ny = e.clientY - dragOffset.y;
		dragMoved = Math.max(dragMoved, Math.hypot(nx - obj.x, ny - obj.y));
		obj.x = nx;
		obj.y = ny;
	}
	function onWindowUp() {
		const id = dragId;
		const moved = dragMoved;
		dragId = null;
		window.removeEventListener('mousemove', onWindowMove);
		window.removeEventListener('mouseup', onWindowUp);
		// Короткое движение — это клик: открываем статью. Длинное —
		// пользователь действительно тянул узел, навигация подавляется.
		if (id !== null && moved < CLICK_THRESHOLD_PX) {
			const slug = slugById.get(id);
			if (slug) onSelect(slug);
		}
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
			onmousedown={(e) => onNodeMouseDown(e, o)}
			aria-label={o.name}
			title={o.name}
			style="left: {o.x}px; top: {o.y}px; width: {o.size}px; height: {o.size}px; z-index: {Math.max(
				1,
				Math.abs(o.id)
			) + 1};"
			class="docs-overlay absolute rounded-full"
			class:dragging={dragId === o.id}
		></button>
	{/each}
</div>

<style>
	/* Overlay поверх узла — невидимый, но кликабельный/перетягиваемый.
	   В покое — grab, при hover слегка подсвечиваем. При drag — grabbing
	   и более яркая подсветка, чтобы пользователь видел захват. */
	.docs-overlay {
		background: transparent;
		border: 0;
		cursor: grab;
		transition: background 0.15s;
	}
	.docs-overlay:hover {
		background: rgba(131, 92, 253, 0.18);
	}
	.docs-overlay.dragging {
		cursor: grabbing;
		background: rgba(131, 92, 253, 0.3);
	}
</style>
