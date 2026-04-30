<script lang="ts">
	import { slide } from 'svelte/transition';
	import { Icon, LightText } from '$lib/components';

	let {
		title,
		text,
		type,
		show = false
	}: {
		title: string;
		text: string;
		type: 'alert' | 'error';
		show?: boolean;
	} = $props();

	// Палитра под токены проекта (layout.css). Error — красный бейдж
	// с белой иконкой; warning ('alert') — жёлтый бейдж с чёрной
	// иконкой (контрастнее на ярком фоне). То же решение, что в
	// Notification — пользователь сразу узнаёт «семью» статусных
	// уведомлений.
	const palette = {
		error: { badge: 'bg-red', stroke: 'white', side: 'border-l-red' },
		alert: { badge: 'bg-yellow', stroke: 'black', side: 'border-l-yellow' }
	};
	const tone = $derived(palette[type] ?? palette.alert);
</script>

<div
	class="overflow-hidden rounded-md border border-l-2 border-gray bg-gray-glass backdrop-blur-xs {tone.side}"
>
	<div class="flex items-center gap-3 p-2.5 text-left">
		<div class="flex size-7 shrink-0 items-center justify-center rounded-full {tone.badge}">
			<Icon name="alert" stroke={tone.stroke} />
		</div>
		<h3 class="min-w-0 flex-1 truncate text-xs leading-snug font-medium">
			<LightText text={title} />
		</h3>
		<div class="shrink-0 opacity-60 {show ? 'rotate-90' : ''} transition-transform">
			<Icon name="forward" />
		</div>
	</div>
	{#if show}
		<div
			transition:slide={{ duration: 200 }}
			class="border-t border-gray px-3 py-2 text-xs leading-relaxed opacity-80"
		>
			<LightText {text} />
		</div>
	{/if}
</div>
