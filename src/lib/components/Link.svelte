<script lang="ts">
	import { tick } from 'svelte';
	import { selectedStore, links as linksStore } from '$lib/stores/objects.svelte';
	import { validationStore } from '$lib/stores/validation.svelte';
	import { contextStore } from '$lib/stores/context.svelte';
	import { pendingNameEdit } from '$lib/stores/pendingEdit.svelte';
	import { LightText } from '$lib/components';
	import type { ILink } from '$lib/interface';

	let {
		id,
		name,
		type,
		is,
		to,
		isValue = false,
		toValue = true
	}: ILink & { isValue?: boolean; toValue?: boolean } = $props();

	let data: string = $derived(`l + ${id}`);
	let selected: boolean = $derived(selectedStore.selected === data);
	let hover: boolean = $derived(selectedStore.hover === data);
	let dasharray: string = $derived(type === 'default' ? '0' : '8 8');

	let x1 = $derived(is.x + is.size / 2);
	let y1 = $derived(is.y + is.size / 2);
	let x2 = $derived(to.x + to.size / 2);
	let y2 = $derived(to.y + to.size / 2);
	let r1 = $derived(is.size / 2);
	let r2 = $derived(to.size / 2);
	let size = $derived((is.size + to.size) / 2);

	let dx = $derived(x2 - x1);
	let dy = $derived(y2 - y1);
	let dist = $derived(Math.hypot(dx, dy) || 1);

	const unitX = $derived(dx / dist);
	const unitY = $derived(dy / dist);

	let sx = $derived(x1 + unitX * r1);
	let sy = $derived(y1 + unitY * r1);
	let ex = $derived(x2 - unitX * r2);
	let ey = $derived(y2 - unitY * r2);
	let midX: number = $derived((sx + ex) / 2);
	let midY: number = $derived((sy + ey) / 2);

	// Уникальные id маркеров на ребро — иначе все стрелки делят один marker и
	// hover-цвет будет «протекать» между линиями.
	let markerStart = $derived(`arrow-s-${id}`);
	let markerEnd = $derived(`arrow-e-${id}`);
	// Размер наконечника привязан к размерам эндпоинтов — как и у имени
	// связи. Минимум 4, чтобы стрелка оставалась видимой даже на
	// мелких объектах.
	let markerSize: number = $derived(Math.max(4, size / 46));
	let strokeColor = $derived.by(() => {
		if (selected || hover) return 'var(--color-accent)';
		// Подсветка проблемных связей включается из toolbar — иначе при
		// каждом изменении графа цвета мерцали бы. Issues живут в сторе
		// актуально, но окраска применяется только при highlight=true.
		if (!validationStore.highlight) return 'white';
		const sev = validationStore.severityForLink(id);
		if (sev === 'error') return 'var(--color-red)';
		if (sev === 'warning') return 'var(--color-yellow)';
		return 'white';
	});

	function onclick() {
		selectedStore.set('selected', data);
	}
	function onmouseenter() {
		selectedStore.set('hover', data);
	}
	function onmouseleave() {
		selectedStore.clear('hover');
	}
	function oncontextmenu(e: MouseEvent) {
		e.preventDefault();
		e.stopPropagation();
		contextStore.set(e, id, 'link');
	}

	// ── редактирование имени ────────────────────────────────────────────────
	let editing: boolean = $state(false);
	let draftName: string = $state('');
	let inputEl: HTMLInputElement | undefined = $state();

	// Если связь только что создана через drag-link — pendingNameEdit
	// помечает её id; автоматически открываем редактор имени с
	// автофокусом и selectAll, чтобы пользователь мог напечатать
	// поверх дефолта без лишнего клика.
	$effect(() => {
		if (pendingNameEdit.claim(id, 'link')) {
			void openEdit();
		}
	});

	async function openEdit() {
		draftName = name;
		editing = true;
		await tick();
		inputEl?.focus();
		inputEl?.select();
	}

	function startEdit(e: MouseEvent) {
		e.stopPropagation();
		void openEdit();
	}
	function commit() {
		const next = draftName.trim();
		// Сохраняем при любом непустом — иначе race с pendingNameEdit
		// мог «съесть» правку (Name.svelte имеет ту же проблему).
		if (next) linksStore.update(id, { name: next });
		editing = false;
	}
	function onKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			e.preventDefault();
			commit();
		} else if (e.key === 'Escape') {
			editing = false;
			draftName = name;
		}
	}

	// Кнопки ◀ и ▶ работают как направленный селектор:
	//   • клик по неактивному концу при активном противоположном —
	//     стрелка переезжает на этот конец (направление развернулось);
	//   • клик по активному — выключает стрелку (без направления);
	//   • клик по неактивному при обоих выключенных — просто включает.
	// Так направление меняется одним кликом и без отдельной кнопки-флипа.
	function toggleArrow(end: 'is' | 'to') {
		const myActive = end === 'is' ? isValue : toValue;
		const otherActive = end === 'is' ? toValue : isValue;

		if (myActive) {
			if (end === 'is') linksStore.update(id, { isValue: false });
			else linksStore.update(id, { toValue: false });
		} else if (otherActive) {
			// Перенос стрелки на этот конец = семантический разворот.
			if (end === 'is') linksStore.update(id, { isValue: true, toValue: false });
			else linksStore.update(id, { toValue: true, isValue: false });
		} else {
			if (end === 'is') linksStore.update(id, { isValue: true });
			else linksStore.update(id, { toValue: true });
		}
	}
</script>

<div>
	<svg class="absolute top-0 left-0 size-full">
		<defs>
			<marker
				id={markerStart}
				viewBox="0 0 10 10"
				refX="2"
				refY="5"
				markerWidth={markerSize}
				markerHeight={markerSize}
				orient="auto-start-reverse"
			>
				<path d="M 10 0 L 0 5 L 10 10 z" fill={strokeColor} />
			</marker>
			<marker
				id={markerEnd}
				viewBox="0 0 10 10"
				refX="8"
				refY="5"
				markerWidth={markerSize}
				markerHeight={markerSize}
				orient="auto"
			>
				<path d="M 0 0 L 10 5 L 0 10 z" fill={strokeColor} />
			</marker>
		</defs>
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<line
			{onmouseenter}
			{onmouseleave}
			{onclick}
			{oncontextmenu}
			x1={sx}
			y1={sy}
			x2={ex}
			y2={ey}
			stroke={strokeColor}
			stroke-width={3}
			stroke-dasharray={dasharray}
			stroke-linecap="round"
			marker-start={isValue ? `url(#${markerStart})` : undefined}
			marker-end={toValue ? `url(#${markerEnd})` : undefined}
		/>
	</svg>
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		{onmouseenter}
		{onmouseleave}
		{onclick}
		{oncontextmenu}
		ondblclick={startEdit}
		style="left: {midX}px; top: {midY}px; font-size: {size / 8}px; z-index: 99999999"
		class="text-border absolute flex -translate-1/2 items-center gap-1"
	>
		{#if editing}
			<input
				bind:this={inputEl}
				bind:value={draftName}
				onkeydown={onKeydown}
				onblur={commit}
				onclick={(e) => e.stopPropagation()}
				style="font-size: {size / 8}px; width: {Math.max(draftName.length, 4) + 1}ch"
				class="text-border rounded-sm border border-accent bg-gray-glass px-1 py-0.5 outline-none"
			/>
		{:else}
			<button
				ondblclick={startEdit}
				title="Двойной клик — переименовать"
				class="text-border cursor-text whitespace-nowrap select-none"
				><LightText text={name} category="Links" /></button
			>
		{/if}
		{#if hover && !editing}
			<button
				data-testid="arrow-is"
				onclick={(e) => {
					e.stopPropagation();
					toggleArrow('is');
				}}
				title="Стрелка на конце «{is.name ?? ''}»"
				style="font-size: {size / 10}px"
				class="rounded-sm bg-gray-glass px-1 {isValue ? 'text-accent' : 'opacity-50'}">◀</button
			>
			<button
				data-testid="arrow-to"
				onclick={(e) => {
					e.stopPropagation();
					toggleArrow('to');
				}}
				title="Стрелка на конце «{to.name ?? ''}»"
				style="font-size: {size / 10}px"
				class="rounded-sm bg-gray-glass px-1 {toValue ? 'text-accent' : 'opacity-50'}">▶</button
			>
		{/if}
	</div>
</div>
