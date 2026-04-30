<script lang="ts">
	import { Icon } from '$lib/components';
	import { onDestroy } from 'svelte';
	import { fly } from 'svelte/transition';

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

	let paused: boolean = $state(false);
	// elapsed — единственный источник истины и для таймера, и для
	// прогресс-бара. Сравниваем с duration на каждом тике.
	let elapsed: number = $state(0);
	let closed: boolean = $state(false);

	const TICK_MS = 50;

	const interval = setInterval(() => {
		if (closed || paused) return;
		elapsed += TICK_MS;
		if (elapsed >= duration) close();
	}, TICK_MS);

	onDestroy(() => clearInterval(interval));

	function pauseHover() {
		paused = true;
	}
	function resumeHover() {
		paused = false;
	}

	function close(e?: Event) {
		// Останавливаем propagation: канвас слушает mouse-события на window.
		e?.stopPropagation();
		if (closed) return;
		closed = true;
		clearInterval(interval);
		// onClose удаляет запись из notificationStore — Svelte unmount-ит
		// этот компонент, fly:out-анимация отыграется сама. Никаких
		// ручных setTimeout/visible-флагов не требуется, и крестик
		// гарантированно срабатывает с первого клика.
		onClose?.();
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

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	role="status"
	onmouseenter={pauseHover}
	onmousemove={pauseHover}
	onmouseleave={resumeHover}
	in:fly={{ x: 100, duration: 250 }}
	out:fly={{ x: 100, duration: 250 }}
	class="relative flex max-w-96 min-w-72 items-center gap-3 overflow-hidden rounded-md border border-gray bg-gray-glass p-3 shadow-lg shadow-black/40 backdrop-blur-xs"
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
		Прогресс-бар. Width считается каждый tick из elapsed/duration —
		без CSS-keyframes, поэтому пауза применяется немедленно.
	-->
	<div
		data-testid="countdown"
		data-paused={paused}
		data-progress={progress.toFixed(3)}
		style="width: {progress * 100}%; transition: width {TICK_MS}ms linear;"
		class="absolute bottom-0 left-0 h-1.5 {tone.bar}"
	></div>
</div>
