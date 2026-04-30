<script lang="ts">
	import { Object, Link, Name } from '$lib/components';
	import { runPhysicsLoop } from '$lib/functions/physics';
	import { appearanceStore } from '$lib/stores/appearance.svelte';
	import { dragStore } from '$lib/stores/drag.svelte';
	import {
		viewStore,
		selectedStore,
		objects as flatObjects,
		links as linksStore
	} from '$lib/stores/objects.svelte';
	import { linkDraft } from '$lib/stores/linkDraft.svelte';
	import { pendingNameEdit } from '$lib/stores/pendingEdit.svelte';
	import { contextStore } from '$lib/stores/context.svelte';
	import { validationStore } from '$lib/stores/validation.svelte';
	import type { ITreeObject } from '$lib/interface';

	let {
		id,
		name,
		type = 'default',
		x = 300,
		y = 300,
		size = 100,
		objects = [],
		links = [],
		selParent,
		noArrows = false
	}: ITreeObject & { noArrows?: boolean } = $props();

	let ref: HTMLElement | undefined = $state(undefined);
	let data = $derived(`o + ${id}`);
	let selected: boolean = $derived(selectedStore.selected === data || selectedStore.has(data));
	let hover: boolean = $derived(selectedStore.hover === data);
	let validationColor: string = $derived.by(() => {
		// Окрашиваем только когда пользователь явно включил подсветку
		// кнопкой в toolbar — иначе при перетаскивании или мелких
		// правках диаграмма мигала бы красным.
		if (!validationStore.highlight) return 'white';
		const sev = validationStore.severityForObject(id);
		if (sev === 'error') return 'var(--color-red)';
		if (sev === 'warning') return 'var(--color-yellow)';
		return 'white';
	});
	const centerX: number = $derived(size / 2);
	const centerY: number = $derived(size / 2);
	const border: string = $derived(type === 'default' ? 'solid' : 'dashed');

	function onmousedown(e: MouseEvent) {
		if (!ref || e.button !== 0) return;
		e.stopPropagation();
		e.preventDefault();

		// Shift+click — мульти-выделение. Группа имеет смысл только в
		// пределах одного уровня (одинаковый parent), иначе bulk-операции
		// над «родитель + его дети» неоднозначны. parent тянем из
		// flat-стора, чтобы не зависеть от prop'ов tree.
		if (e.shiftKey) {
			const parent = flatObjects.get(id)?.parent ?? null;
			selectedStore.toggleAtLevel(data, parent);
			return;
		}

		dragStore.setDrag({
			ref,
			id,
			offsetX: e.clientX - x,
			offsetY: e.clientY - y,
			startX: x,
			startY: y
		});
		selectedStore.set('selected', data);
		if (selected) selectedStore.clear('hover');
	}
	function onmousemove(event: MouseEvent) {
		const dragObj = dragStore.getValue();

		if (dragObj) {
			const obj = objects.find((o) => o.id === dragObj.id);

			if (!obj) return;
			obj.x = event.clientX - dragObj.offsetX;
			obj.y = event.clientY - dragObj.offsetY;
		}
	}
	function onmouseover(e: MouseEvent) {
		e.stopPropagation();
		selectedStore.set('hover', data);
		// Если идёт перетягивание связи — этот объект становится
		// потенциальным target. Без этого drop-зона не определится.
		if (linkDraft.active) linkDraft.setTarget(id);
	}
	function onmouseleave(e: MouseEvent) {
		e.stopPropagation();
		selectedStore.clear('hover');
		linkDraft.clearTarget(id);
	}
	function ondblclick(e: MouseEvent) {
		e.stopPropagation();
		viewStore.set(id);
	}
	function onmouseup() {
		if (dragStore.hasValue()) dragStore.clearDrag();
	}
	function oncontextmenu(e: MouseEvent) {
		e.preventDefault();
		e.stopPropagation();
		contextStore.set(e, id, 'object');
	}
	$effect(() => {
		if (objects.length === 0) return;
		return runPhysicsLoop({
			getObjects: () => objects,
			getLinks: () => links,
			getCenter: () => ({ x: centerX, y: centerY }),
			isPaused: () => dragStore.hasValue(),
			onWakeSignal: (wake) => dragStore.subscribe(() => wake())
		});
	});

	// Снимаем выделение при клике вне выбранного объекта.
	// Capture-фаза нужна, чтобы listener сработал ДО onmousedown на
	// другом Object'e (тот вызывает stopPropagation в bubble) — иначе
	// клик по соседу не очистил бы прежнее выделение в глобальном
	// listener'е, и могла остаться рассинхронизация. Подписываемся
	// только когда объект реально выбран — лишних подписок нет.
	$effect(() => {
		if (!selected) return;
		function onWindowMouseDown(e: MouseEvent) {
			if (!ref) return;
			if (ref.contains(e.target as Node)) return;
			// Shift+click — операция мульти-выделения. Если её обработать
			// здесь как «клик вне», группа сбросится прямо перед тем как
			// onmousedown целевого Object добавит элемент. Пропускаем.
			if (e.shiftKey) return;
			selectedStore.clear('selected');
		}
		window.addEventListener('mousedown', onWindowMouseDown, true);
		return () => window.removeEventListener('mousedown', onWindowMouseDown, true);
	});
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	bind:this={ref}
	style="top: {y}px; left: {x}px; width: {size}px; height: {size}px; z-index: {Math.max(
		1,
		Math.abs(id)
	)};"
	class="absolute flex flex-col"
	{onmousemove}
>
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<!-- TODO: размеры ввода большие -->
	<div class="relative size-full">
		<Name {id} {name} {size} />
		<!-- svelte-ignore a11y_mouse_events_have_key_events -->
		<div
			{onmousedown}
			{ondblclick}
			{onmouseup}
			{oncontextmenu}
			{onmouseover}
			{onmouseleave}
			style="border: {size / 100}px {border} {selParent
				? 'black'
				: validationColor}; outline: {size / 100}px {border} black; transition-duration: {size}ms"
			class={`${selected && 'border-none! bg-accent!'} ${hover && 'border-0! outline-accent!'} size-full rounded-full bg-black transition-all`}
		>
			{#each objects as { id, name, type, x, y, size, objects, links } (id)}
				{#if appearanceStore.has(id)}
					<Object
						{id}
						{name}
						{type}
						{x}
						{y}
						{size}
						{objects}
						{links}
						{noArrows}
						selParent={selected ? true : false}
					/>
				{/if}
			{/each}
			{#each links as l (l.id)}
				{@const self = { x: 0, y: 0, size }}
				{@const is = l.is === id ? self : objects.find((o) => o.id === l.is)}
				{@const to = l.to === id ? self : objects.find((o) => o.id === l.to)}

				{#if is && to && (l.is === id || appearanceStore.has(l.is)) && (l.to === id || appearanceStore.has(l.to))}
					<Link
						id={l.id}
						name={l.name}
						type={l.type}
						{is}
						{to}
						isValue={noArrows ? false : (l.isValue ?? false)}
						toValue={noArrows ? false : (l.toValue ?? true)}
					/>
				{/if}
			{/each}
		</div>
		{#if selected}
			<!-- Drag-handle для создания связи. Mousedown начинает черновик
			     в linkDraft, mouseup на другом Object.svelte закрывает —
			     Canvas рисует pending-line и обрабатывает hit. -->
			<button
				type="button"
				aria-label="create-link"
				onmousedown={(e) => {
					if (e.button !== 0) return;
					e.stopPropagation();
					e.preventDefault();
					linkDraft.start(id, e.clientX, e.clientY);
				}}
				style="width: {size / 5}px; height: {size / 5}px; border: {size / 100}px solid black;"
				class="absolute top-full left-1/2 z-5 -translate-x-1/2 cursor-crosshair rounded-full bg-white transition-colors hover:bg-accent"
			></button>
		{/if}
	</div>
</div>
