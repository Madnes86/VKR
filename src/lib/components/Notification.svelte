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

	let visible: boolean = $state(true);
	let isHiding: boolean = $state(false);
	let paused: boolean = $state(false);
	// elapsed — единственный источник истины и для таймера, и для
	// прогресс-бара: оба считают одно и то же.
	let elapsed: number = $state(0);

	const TICK_MS = 50;

	const interval = setInterval(() => {
		if (isHiding || paused) return;
		elapsed += TICK_MS;
		if (elapsed >= duration) close();
	}, TICK_MS);

	onDestroy(() => clearInterval(interval));

	// onmousemove на каждом тике курсора подтверждает hover. Это
	// надёжнее одиночного onmouseenter — у которого случались пропуски
	// при движении через дочерние элементы с собственным transition
	// (крестик с hover-стилями). Если первый mouseenter потерялся,
	// следующий же mousemove паузит. mouseleave срабатывает один раз
	// при реальном выходе — и снимает паузу.
	function pauseHover() {
		if (isHiding || paused) return;
		paused = true;
	}
	function resumeHover() {
		if (isHiding || !paused) return;
		paused = false;
	}

	function close(e?: Event) {
		// Останавливаем propagation: канвас слушает mouse/wheel на window
		// и при кликах внутри карточки не должен реагировать.
		e?.stopPropagation();
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
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		role="status"
		onmouseenter={pauseHover}
		onmousemove={pauseHover}
		onmouseleave={resumeHover}
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
