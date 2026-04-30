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

	// Таймер закрытия живёт в компоненте, не в сторе. При hover паузим
	// его и аккумулируем «отыгранное» время в elapsed, чтобы возобновить
	// с того же места, а не сначала. Это синхронизируется с CSS-
	// анимацией прогресс-бара, у которой animation-play-state: paused.
	let elapsed = 0;
	let lastStart = Date.now();
	let timer: ReturnType<typeof setTimeout> | undefined;

	function startTimer() {
		if (isHiding) return;
		lastStart = Date.now();
		const remaining = Math.max(0, duration - elapsed);
		timer = setTimeout(close, remaining);
	}
	function pauseTimer() {
		if (timer !== undefined) {
			clearTimeout(timer);
			timer = undefined;
			elapsed += Date.now() - lastStart;
		}
	}

	startTimer();

	onDestroy(() => {
		if (timer !== undefined) clearTimeout(timer);
	});

	function close() {
		if (isHiding) return;
		isHiding = true;
		if (timer !== undefined) {
			clearTimeout(timer);
			timer = undefined;
		}
		// Даём 300мс на slide-out, затем уведомляем родителя — тот
		// удаляет запись из notificationStore. Если onClose не передан
		// (нет контейнера-стека) — просто скрываемся локально.
		setTimeout(() => {
			visible = false;
			onClose?.();
		}, 300);
	}

	function onmouseenter() {
		if (paused || isHiding) return;
		paused = true;
		pauseTimer();
	}
	function onmouseleave() {
		if (!paused || isHiding) return;
		paused = false;
		startTimer();
	}

	// Палитра под токены проекта (layout.css).
	const palette = {
		success: { bg: 'bg-accent', stroke: 'white', bar: 'bg-accent' },
		error: { bg: 'bg-red', stroke: 'white', bar: 'bg-red' },
		warning: { bg: 'bg-yellow', stroke: 'black', bar: 'bg-yellow' },
		info: { bg: 'bg-gray', stroke: 'white', bar: 'bg-accent' }
	};
	const tone = $derived(palette[type] ?? palette.info);
</script>

{#if visible}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		role="status"
		{onmouseenter}
		{onmouseleave}
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
			Прогресс-бар обратного отсчёта. Width анимируется CSS-keyframes
			от 100% до 0 за `duration`. animation-play-state управляется
			реактивно — при hover ставится paused, и таймер закрытия
			синхронно паузится в JS. Бар идёт цветом, согласованным с
			бейджем типа уведомления.
		-->
		<div
			data-testid="countdown"
			style="animation-duration: {duration}ms; animation-play-state: {paused
				? 'paused'
				: 'running'};"
			class="countdown absolute bottom-0 left-0 h-1.5 {tone.bar}"
		></div>
	</div>
{/if}

<style>
	.countdown {
		animation-name: shrink;
		animation-timing-function: linear;
		animation-fill-mode: forwards;
	}
	@keyframes shrink {
		from {
			width: 100%;
		}
		to {
			width: 0%;
		}
	}
</style>
