<script lang="ts">
	import { Icon } from '$lib/components';
	import { onDestroy } from 'svelte';

	let {
		icon = 'alert',
		title,
		type = 'info',
		duration = 10000,
		onClose
	}: {
		icon?: string;
		title?: string;
		type?: 'success' | 'error' | 'info' | 'warning';
		duration?: number;
		onClose?: () => void;
	} = $props();

	let ref: HTMLDivElement | undefined = $state(undefined);
	let visible: boolean = $state(true);
	let isHiding: boolean = $state(false);
	let paused: boolean = $state(false);
	// elapsed — единственный источник истины и для таймера, и для
	// прогресс-бара: оба считают одно и то же. Раньше JS-таймер
	// и CSS-keyframes считали независимо, и при быстрых сменах hover
	// CSS-анимация теряла состояние play-state — пауза работала
	// «через раз». Теперь и закрытие, и ширина бара берутся из
	// elapsed, синхронизация автоматическая.
	let elapsed: number = $state(0);

	const TICK_MS = 50;

	// Опрашиваем CSS :hover через matches(':hover') каждый tick, а не
	// слушаем pointerenter/pointerleave. Pointer-события могут «теряться»
	// при движении через дочерние элементы с собственным transition
	// (наш крестик с hover-стилями), из-за чего пауза срабатывала через
	// раз. matches(':hover') опирается напрямую на состояние браузера —
	// оно одинаково для крестика, текста, бейджа и любых других детей.
	const interval = setInterval(() => {
		if (isHiding) return;
		paused = ref?.matches(':hover') ?? false;
		if (paused) return;
		elapsed += TICK_MS;
		if (elapsed >= duration) close();
	}, TICK_MS);

	onDestroy(() => clearInterval(interval));

	function close() {
		if (isHiding) return;
		isHiding = true;
		// Даём 300мс на slide-out, затем уведомляем родителя — тот
		// удаляет запись из notificationStore. Если onClose не передан
		// (нет контейнера-стека) — просто скрываемся локально.
		setTimeout(() => {
			visible = false;
			onClose?.();
		}, 300);
	}

	// Палитра под токены проекта (layout.css).
	const palette = {
		success: { bg: 'bg-accent', stroke: 'white', bar: 'bg-accent' },
		error: { bg: 'bg-red', stroke: 'white', bar: 'bg-red' },
		warning: { bg: 'bg-yellow', stroke: 'black', bar: 'bg-yellow' },
		info: { bg: 'bg-gray', stroke: 'white', bar: 'bg-accent' }
	};
	const tone = $derived(palette[type] ?? palette.info);
	const progress = $derived(Math.max(0, Math.min(1, 1 - elapsed / duration)));
</script>

{#if visible}
	<div
		bind:this={ref}
		role="status"
		class="{isHiding
			? 'hide'
			: 'show'} relative flex max-w-96 min-w-72 items-center gap-3 overflow-hidden rounded-md border border-gray bg-gray-glass p-3 shadow-lg shadow-black/40 backdrop-blur-xs"
	>
		<div class="flex size-8 shrink-0 items-center justify-center rounded-full {tone.bg}">
			<Icon name={icon} stroke={tone.stroke} />
		</div>
		<h3 class="w-full text-xs leading-snug font-medium">{title}</h3>
		<button
			type="button"
			onclick={close}
			aria-label="close"
			class="click shrink-0 rounded-sm p-1 opacity-60 transition hover:bg-gray hover:opacity-100"
		>
			<Icon name="cross" />
		</button>

		<!--
			Прогресс-бар обратного отсчёта. Width вычисляется из elapsed/
			duration в каждом тике setInterval — никаких CSS-анимаций,
			поэтому пауза по hover применяется мгновенно и надёжно.
			data-paused / data-progress нужны для интеграционных тестов.
		-->
		<div
			data-testid="countdown"
			data-paused={paused}
			data-progress={progress.toFixed(3)}
			style="width: {progress * 100}%; transition: width {TICK_MS}ms linear;"
			class="absolute bottom-0 left-0 h-1.5 {tone.bar}"
		></div>
	</div>
{/if}
