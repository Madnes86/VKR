<script lang="ts">
	import { onMount } from 'svelte';
	import { Object, Link } from '$lib/components';
	import { dragStore } from '$lib/stores/drag.svelte';
	import { runPhysicsLoop } from '$lib/functions/physics';
	import type { ITreeObject, ILink } from '$lib/interface';

	const ID_A = 9_000_001;
	const ID_B = 9_000_002;
	const ID_C = 9_000_003;
	const ID_D = 9_000_004;

	let objects: ITreeObject[] = $state([
		{
			id: ID_A,
			name: 'Service',
			type: 'default',
			parent: null,
			x: 60,
			y: 130,
			size: 130,
			mass: 1,
			objects: [
				{
					id: ID_C,
					name: 'Read',
					type: 'default',
					parent: ID_A,
					x: 10,
					y: 40,
					size: 50,
					mass: 1,
					objects: [],
					links: []
				},
				{
					id: ID_D,
					name: 'Write',
					type: 'optional',
					parent: ID_A,
					x: 60,
					y: 40,
					size: 50,
					mass: 1,
					objects: [],
					links: []
				}
			],
			links: [{ id: 9_100_001, name: 'sync', type: 'default', is: ID_C, to: ID_D }]
		},
		{
			id: ID_B,
			name: 'Gateway',
			type: 'default',
			parent: null,
			x: 210,
			y: 130,
			size: 130,
			mass: 1,
			objects: [],
			links: []
		}
	]);
	let topLinks: ILink[] = $state([
		{ id: 9_100_003, name: 'call', type: 'default', is: ID_A, to: ID_B }
	]);

	let container: HTMLDivElement | undefined = $state();
	let width = $state(400);
	let height = $state(400);
	let centerX = $derived(width / 2);
	let centerY = $derived(height / 2);
	let visible = $state(true);

	function onmousemove(e: MouseEvent) {
		const dragObj = dragStore.getValue();
		if (!dragObj) return;
		const obj = objects.find((o) => o.id === dragObj.id);
		if (!obj) return;
		obj.x = e.clientX - dragObj.offsetX;
		obj.y = e.clientY - dragObj.offsetY;
	}
	function onmouseup() {
		if (dragStore.hasValue()) dragStore.clearDrag();
	}

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

		const block = (e: Event) => {
			e.stopPropagation();
			e.preventDefault();
		};
		const blockArrow = (e: MouseEvent) => {
			const t = e.target as HTMLElement | null;
			if (t?.tagName === 'BUTTON' && (t.textContent === '◀' || t.textContent === '▶')) {
				e.stopPropagation();
				e.preventDefault();
			}
		};
		c.addEventListener('dblclick', block, true);
		c.addEventListener('contextmenu', block, true);
		c.addEventListener('click', blockArrow, true);

		let wakeFn: (() => void) | null = null;
		const stopLoop = runPhysicsLoop({
			getObjects: () => objects,
			getLinks: () => topLinks,
			getCenter: () => ({ x: centerX, y: centerY }),
			isPaused: () => !visible || dragStore.hasValue(),
			onWakeSignal: (wake) => {
				wakeFn = wake;
				return dragStore.subscribe(() => wake());
			}
		});

		const io = new IntersectionObserver((entries) => {
			const wasVisible = visible;
			visible = entries[0]?.isIntersecting ?? true;
			if (!wasVisible && visible) wakeFn?.();
		});
		io.observe(c);

		window.addEventListener('mousemove', onmousemove);
		window.addEventListener('mouseup', onmouseup);

		return () => {
			stopLoop();
			ro.disconnect();
			io.disconnect();
			c.removeEventListener('dblclick', block, true);
			c.removeEventListener('contextmenu', block, true);
			c.removeEventListener('click', blockArrow, true);
			window.removeEventListener('mousemove', onmousemove);
			window.removeEventListener('mouseup', onmouseup);
		};
	});
</script>

<div
	bind:this={container}
	class="relative h-100 w-100 shrink-0 overflow-hidden rounded-md select-none"
>
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
			noArrows
		/>
	{/each}
	{#each topLinks as l (l.id)}
		{@const isObj = objects.find((o) => o.id === l.is)}
		{@const toObj = objects.find((o) => o.id === l.to)}
		{#if isObj && toObj}
			<Link
				id={l.id}
				name={l.name}
				type={l.type}
				is={isObj}
				to={toObj}
				isValue={false}
				toValue={false}
			/>
		{/if}
	{/each}
</div>
