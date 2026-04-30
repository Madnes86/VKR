<script lang="ts">
	import { Icon } from '$lib/components';
	import { onDestroy } from 'svelte';

	let {
		icon = 'alert',
		title,
		type = 'info',
		duration = 3000,
		onClose
	}: {
		icon?: string;
		title?: string;
		type?: 'success' | 'error' | 'info' | 'warning';
		duration?: number;
		onClose?: () => void;
	} = $props();

	let visible = $state(true);
	let timeout: ReturnType<typeof setTimeout>;
	let isHiding: boolean = $state(false);

	// Палитра под токены проекта (layout.css):
	// accent — фиолетовый success, red — ошибки, yellow — warnings,
	// gray — нейтральный info. Иконка в цветном круге слева вместо
	// прежней цветной полосы border-l — даёт более выразительный
	// фокус, согласуется с круглыми бейджами в Avatar и Toolbar.
	const palette = {
		success: { bg: 'bg-accent', stroke: 'white' },
		error: { bg: 'bg-red', stroke: 'white' },
		warning: { bg: 'bg-yellow', stroke: 'black' },
		info: { bg: 'bg-gray', stroke: 'white' }
	};
	const tone = $derived(palette[type] ?? palette.info);

	timeout = setTimeout(() => {
		close();
	}, duration);

	onDestroy(() => {
		clearTimeout(timeout);
	});

	function close() {
		isHiding = true;
		clearTimeout(timeout);
		setTimeout(() => {
			visible = false;
			onClose?.();
		}, 300);
	}
</script>

{#if visible}
	<!--
		Позиционирование (fixed/bottom/right) задаётся контейнером-стеком
		в +page.svelte. Стиль карточки выровнен с DiagramToolbar:
		gray-glass + border + backdrop-blur + rounded-md, чтобы
		уведомления визуально были «семьёй» с панелями приложения,
		а не сторонним alert'ом.
	-->
	<div
		class="{isHiding
			? 'hide'
			: 'show'} flex max-w-96 min-w-72 items-center gap-3 rounded-md border border-gray bg-gray-glass p-3 shadow-lg shadow-black/40 backdrop-blur-xs"
	>
		<div class="flex size-8 shrink-0 items-center justify-center rounded-full {tone.bg}">
			<Icon name={icon} stroke={tone.stroke} />
		</div>
		<h3 class="w-full text-sm leading-snug font-medium">{title}</h3>
		<button
			type="button"
			onclick={close}
			aria-label="close"
			class="click shrink-0 rounded-sm p-1 opacity-60 transition hover:bg-gray hover:opacity-100"
		>
			<Icon name="cross" />
		</button>
	</div>
{/if}
