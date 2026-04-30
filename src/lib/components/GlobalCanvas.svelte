<script lang="ts">
	import { objects as objMock } from '$lib/mocs/objects';
	import { links as linkMock } from '$lib/mocs/links';
	import { viewStore, selectedStore } from '$lib/stores/objects.svelte';
	import { scaleStore } from '$lib/stores/scale.svelte';
	import { goto } from '$app/navigation';
	import LightText from '$lib/components/LightText.svelte';

	type Node = { id: number; name: string; type: string; x: number; y: number; size: number };
	type Edge = { id: number; name: string; type: string; is: Node; to: Node };

	const BASE_SIZE = 64;

	// Tree metadata (static)
	const byId = new Map(objMock.map((o) => [o.id, o]));
	const depths = new Map<number, number>();
	for (const o of objMock) {
		let d = 0;
		let cur: typeof o | undefined = o;
		while (cur && cur.parent !== null && cur.parent !== undefined) {
			d++;
			cur = byId.get(cur.parent);
		}
		depths.set(o.id, d);
	}
	const childrenOf = new Map<number, number[]>();
	for (const o of objMock) {
		if (o.parent !== null && o.parent !== undefined) {
			if (!childrenOf.has(o.parent)) childrenOf.set(o.parent, []);
			childrenOf.get(o.parent)!.push(o.id);
		}
	}
	const hasChildren = (id: number) => (childrenOf.get(id)?.length ?? 0) > 0;
	const descendantCount = (() => {
		const m = new Map<number, number>();
		const count = (id: number): number => {
			if (m.has(id)) return m.get(id)!;
			const cs = childrenOf.get(id) ?? [];
			const total = cs.length + cs.reduce((s, c) => s + count(c), 0);
			m.set(id, total);
			return total;
		};
		for (const o of objMock) count(o.id);
		return m;
	})();
	const maxDepth = Math.max(...depths.values());
	const parentOf = (id: number) => byId.get(id)?.parent ?? null;

	const currentDepth = $derived.by(() => {
		const s = scaleStore.value;
		const fraction = (s - 0.5) / 2.5; // 0..1
		return Math.max(0, Math.min(maxDepth, Math.floor(fraction * (maxDepth + 1))));
	});

	// Parent size must fit its direct children with repulsion gap.
	// For N children of max size M: r_eff = M * 0.65 (half of desired center distance).
	// d = r_eff / sin(π/N) (distance from parent center to child center).
	// R = d + r_actual (parent radius so child's physical edge sits inside).
	// Minimum R = r_actual * 1.3 (for N=1 or small N, keeps parent visibly larger).
	const sizeCache = new Map<number, number>();
	function sizeFor(id: number): number {
		if (sizeCache.has(id)) return sizeCache.get(id)!;
		const cs = childrenOf.get(id) ?? [];
		let result = BASE_SIZE;
		if (cs.length > 0) {
			const maxChild = Math.max(...cs.map((c) => sizeFor(c)));
			const rActual = maxChild / 2;
			const rEff = maxChild * 0.65;
			let d: number;
			if (cs.length === 1) d = 0;
			else if (cs.length === 2) d = rEff;
			else d = rEff / Math.sin(Math.PI / cs.length);
			const R = Math.max(rActual * 1.3, d + rActual);
			result = 2 * R;
		}
		sizeCache.set(id, result);
		return result;
	}
	for (const o of objMock) sizeFor(o.id);

	function isVisible(id: number, depth: number): boolean {
		const d = depths.get(id)!;
		if (d > depth) return false;
		if (d === depth) return true;
		return !hasChildren(id);
	}

	// Initial positions: each child centered inside its parent's circle.
	let nodes: Node[] = $state(
		(() => {
			const pos = new Map<number, { x: number; y: number }>(); // top-left positions
			const roots = objMock.filter((o) => o.parent === null || o.parent === undefined);
			roots.forEach((o, i) => {
				const s = sizeFor(o.id);
				pos.set(o.id, { x: 200 + i * (s + 80), y: 200 });
			});
			const place = (id: number) => {
				const cs = childrenOf.get(id) ?? [];
				const p = pos.get(id)!;
				const pSize = sizeFor(id);
				const pcx = p.x + pSize / 2;
				const pcy = p.y + pSize / 2;
				cs.forEach((cid, i) => {
					const cSize = sizeFor(cid);
					const angle = (i / Math.max(1, cs.length)) * Math.PI * 2;
					const radius = Math.max(0, pSize / 2 - cSize / 2) * 0.5;
					const cx = pcx + Math.cos(angle) * radius;
					const cy = pcy + Math.sin(angle) * radius;
					pos.set(cid, { x: cx - cSize / 2, y: cy - cSize / 2 });
					place(cid);
				});
			};
			for (const r of roots) place(r.id);
			return objMock.map((o) => ({
				id: o.id,
				name: o.name,
				type: o.type,
				x: pos.get(o.id)!.x,
				y: pos.get(o.id)!.y,
				size: sizeFor(o.id)
			}));
		})()
	);

	const visibleNodes = $derived(nodes.filter((n) => isVisible(n.id, currentDepth)));

	const edges: Edge[] = $derived.by(() => {
		const vbid = new Map(visibleNodes.map((n) => [n.id, n]));
		return linkMock
			.map((l) => {
				const is = vbid.get(l.is);
				const to = vbid.get(l.to);
				if (!is || !to) return null;
				return { id: l.id, name: l.name, type: l.type, is, to };
			})
			.filter((x): x is Edge => x !== null);
	});

	// No spawn-on-visible effect: positions are set deterministically in initial
	// place() (children arranged around parent center at fixed angles), and
	// physics only mutates visible nodes — hidden ones stay frozen. This means
	// zoom-in and zoom-out always return nodes to the same (or last physics-
	// settled) positions, not random ones.

	let container: HTMLDivElement | null = $state(null);
	let draggedId: number | null = $state(null);
	let dragOffX = 0;
	let dragOffY = 0;
	let dragMoved = false;

	let camX: number = $state(0);
	let camY: number = $state(0);
	let panning: boolean = $state(false);
	let panStartX = 0;
	let panStartY = 0;

	function step() {
		const vn = visibleNodes;
		const n = vn.length;
		if (n === 0) return;
		const fx = new Float64Array(n);
		const fy = new Float64Array(n);
		for (let i = 0; i < n; i++) {
			const a = vn[i];
			const ax = a.x + a.size / 2;
			const ay = a.y + a.size / 2;
			for (let j = i + 1; j < n; j++) {
				const b = vn[j];
				const bx = b.x + b.size / 2;
				const by = b.y + b.size / 2;
				const dx = ax - bx;
				const dy = ay - by;
				const dist = Math.sqrt(dx * dx + dy * dy);
				const desired = (a.size + b.size) * 0.65;
				if (dist < desired && dist > 0.01) {
					const compr = 1 - dist / desired;
					const strength = compr * compr * 300;
					const nx = dx / dist;
					const ny = dy / dist;
					fx[i] += nx * strength;
					fy[i] += ny * strength;
					fx[j] -= nx * strength;
					fy[j] -= ny * strength;
				}
			}
		}
		for (let i = 0; i < n; i++) {
			if (vn[i].id === draggedId) continue;
			vn[i].x += fx[i] * 0.9;
			vn[i].y += fy[i] * 0.9;
		}
	}

	$effect(() => {
		let frame: number;
		function tick() {
			step();
			frame = requestAnimationFrame(tick);
		}
		frame = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(frame);
	});

	function localCoords(e: MouseEvent) {
		if (!container) return { x: e.clientX, y: e.clientY };
		const r = container.getBoundingClientRect();
		const s = scaleStore.value;
		const cx = r.width / 2;
		const cy = r.height / 2;
		const vx = e.clientX - r.left - camX;
		const vy = e.clientY - r.top - camY;
		return {
			x: (vx - cx) / s + cx,
			y: (vy - cy) / s + cy
		};
	}

	function onContainerMouseDown(e: MouseEvent) {
		if (e.button !== 0) return;
		panning = true;
		panStartX = e.clientX - camX;
		panStartY = e.clientY - camY;
	}

	function onNodeMouseDown(e: MouseEvent, n: Node) {
		if (e.button !== 0) return;
		e.stopPropagation();
		const { x, y } = localCoords(e);
		draggedId = n.id;
		dragOffX = x - n.x;
		dragOffY = y - n.y;
		dragMoved = false;
	}
	function onmousemove(e: MouseEvent) {
		if (draggedId != null) {
			const { x, y } = localCoords(e);
			const n = nodes.find((x) => x.id === draggedId);
			if (!n) return;
			n.x = x - dragOffX;
			n.y = y - dragOffY;
			dragMoved = true;
			return;
		}
		if (panning) {
			camX = e.clientX - panStartX;
			camY = e.clientY - panStartY;
		}
	}
	function onmouseup() {
		draggedId = null;
		panning = false;
	}

	function onNodeClick(n: Node) {
		if (dragMoved) return;
		selectedStore.set('selected', `o + ${n.id}`);
		viewStore.set(n.id);
		goto('/app');
	}
	function hover(n: Node) {
		selectedStore.set('hover', `o + ${n.id}`);
	}
	function leave() {
		selectedStore.clear('hover');
	}

	function onwheel(e: WheelEvent) {
		e.preventDefault();
		if (!container) return;
		const rect = container.getBoundingClientRect();
		const mx = e.clientX - rect.left;
		const my = e.clientY - rect.top;
		const cx = rect.width / 2;
		const cy = rect.height / 2;
		const oldScale = scaleStore.value;
		const factor = Math.exp(-e.deltaY * 0.0015);
		scaleStore.value = oldScale * factor;
		const r = scaleStore.value / oldScale;
		camX = r * camX + (mx - cx) * (1 - r);
		camY = r * camY + (my - cy) * (1 - r);
	}

	function isSelected(id: number) {
		return selectedStore.selected === `o + ${id}`;
	}
	function isHover(id: number) {
		return selectedStore.hover === `o + ${id}`;
	}
</script>

<svelte:window {onmousemove} {onmouseup} />

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	bind:this={container}
	{onwheel}
	onmousedown={onContainerMouseDown}
	class="relative h-screen w-full overflow-hidden bg-zinc-950 select-none {panning
		? 'cursor-grabbing'
		: 'cursor-grab'}"
>
	<div class="absolute inset-0" style="transform: translate({camX}px, {camY}px)">
		<div
			class="h-full w-full"
			style="transform: scale({scaleStore.value}); transform-origin: 50% 50%"
		>
			<svg class="pointer-events-none absolute top-0 left-0 size-full">
				{#each edges as e (e.id)}
					{@const isHighlighted =
						isHover(e.is.id) || isHover(e.to.id) || isSelected(e.is.id) || isSelected(e.to.id)}
					<line
						x1={e.is.x + e.is.size / 2}
						y1={e.is.y + e.is.size / 2}
						x2={e.to.x + e.to.size / 2}
						y2={e.to.y + e.to.size / 2}
						stroke={isHighlighted ? 'var(--color-accent)' : '#555'}
						stroke-width="2"
						stroke-dasharray={e.type === 'default' ? '0' : '6 6'}
						stroke-linecap="round"
					/>
				{/each}
			</svg>
			{#each visibleNodes as n (n.id)}
				{@const cluster = hasChildren(n.id)}
				{@const dc = descendantCount.get(n.id) ?? 0}
				{@const fontSize = Math.max(
					11,
					Math.min(n.size / 6, (n.size * 0.9) / Math.max(4, n.name.length))
				)}
				{@const badgeSize = Math.max(14, fontSize * 1.4)}
				<!-- svelte-ignore a11y_click_events_have_key_events -->
				<button
					onmousedown={(e) => onNodeMouseDown(e, n)}
					onclick={() => onNodeClick(n)}
					onmouseenter={() => hover(n)}
					onmouseleave={leave}
					aria-label={n.name}
					style="left: {n.x}px; top: {n.y}px; width: {n.size}px; height: {n.size}px; font-size: {fontSize}px"
					class="absolute flex cursor-grab items-center justify-center rounded-full border-2 bg-black text-white transition-colors active:cursor-grabbing
                    {isSelected(n.id)
						? 'border-accent'
						: isHover(n.id)
							? 'border-accent/70'
							: 'border-white'}"
				>
					<span class="pointer-events-none truncate px-2">
						<LightText text={n.name} />
					</span>
					{#if cluster}
						<span
							style="width: {badgeSize}px; height: {badgeSize}px; font-size: {Math.max(
								9,
								fontSize * 0.55
							)}px"
							class="pointer-events-none absolute -top-1 -right-1 flex items-center justify-center rounded-full bg-accent text-white"
						>
							{dc}
						</span>
					{/if}
				</button>
			{/each}
		</div>
	</div>

	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		onmousedown={(e) => e.stopPropagation()}
		class="absolute right-2 bottom-2 z-20 flex items-center gap-1 rounded-md bg-black/60 px-2 py-1 font-mono text-xs text-white select-none"
	>
		<button
			onclick={() => scaleStore.zoomOut()}
			class="click px-2 hover:text-accent"
			aria-label="zoom-out">−</button
		>
		<span>{Math.round(scaleStore.value * 100)}%</span>
		<button
			onclick={() => scaleStore.zoomIn()}
			class="click px-2 hover:text-accent"
			aria-label="zoom-in">+</button
		>
		<span class="ml-2 text-zinc-500">d{currentDepth}/{maxDepth}</span>
	</div>
</div>
