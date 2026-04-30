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

	const color = {
		success: 'border-green-400',
		error: 'border-red',
		info: 'border-blue-400',
		warning: 'border-yellow'
	};

	timeout = setTimeout(() => {
		onclick();
	}, duration);

	onDestroy(() => {
		clearTimeout(timeout);
	});

	function onclick() {
		isHiding = true;
		clearTimeout(timeout);
		setTimeout(() => {
			visible = false;
			onClose?.();
		}, 300);
	}
</script>

{#if visible}
	<!-- Позиционирование (fixed/bottom/right) задаётся контейнером-стеком
         в +page.svelte, чтобы несколько уведомлений могли уживаться
         друг над другом, а не накладываться в одной точке. -->
	<div
		class="{isHiding ? 'hide' : 'show'} {color[type] ||
			'bg-white'} flex max-w-96 min-w-72 items-center gap-4 border-l-3 bg-gray-glass p-4 shadow-lg"
	>
		<div class="size-5 shrink-0">
			<Icon name={icon} />
		</div>
		<h3 class="w-full">{title}</h3>
		<button {onclick} class="click shrink-0 rounded-sm p-2 hover:bg-gray">
			<Icon name="cross" />
		</button>
	</div>
{/if}
