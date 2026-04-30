<script lang="ts">
	let {
		src = null,
		name = '',
		size = 34
	}: {
		src?: string | null;
		name?: string;
		size?: number;
	} = $props();

	const initial = $derived((name?.trim().charAt(0) || '?').toUpperCase());
	const fontSize = $derived(Math.round(size / 2.4));
	let imageFailed = $state(false);

	// При смене src — сбрасываем флаг ошибки, чтобы новый URL получил
	// ещё один шанс отрисоваться.
	$effect(() => {
		src;
		imageFailed = false;
	});
</script>

{#if src && !imageFailed}
	<img
		{src}
		alt={name}
		onerror={() => (imageFailed = true)}
		style="width: {size}px; height: {size}px"
		class="shrink-0 rounded-full object-cover"
	/>
{:else}
	<div
		aria-label={name}
		style="width: {size}px; height: {size}px; font-size: {fontSize}px"
		class="flex shrink-0 items-center justify-center rounded-full bg-accent font-semibold text-white select-none"
	>
		{initial}
	</div>
{/if}
