<script lang="ts">
	import { Alert, Icon } from '$lib/components';
	import { searchStore } from '$lib/stores/search.svelte';
	import { validationStore } from '$lib/stores/validation.svelte';
	import { i18n } from '$lib/i18n';

	let query = $derived(searchStore.get());

	// Issue-ы из валидации показываем как первый блок: для пользователя
	// это самые свежие ошибки текущей диаграммы. Severity маппится на
	// тип IAlert: error → 'error', warning → 'alert' (так оформлен
	// существующий компонент).
	let validationAlerts = $derived(
		validationStore.issues
			.filter((i) => !query || i.message.toLowerCase().includes(query.toLowerCase()))
			.map((i, idx) => ({
				key: `v-${i.code}-${idx}`,
				title: i.severity === 'error' ? i18n.t('alerts.title.error') : i18n.t('alerts.title.warn'),
				text: i.message,
				type: i.severity === 'error' ? ('error' as const) : ('alert' as const)
			}))
	);

	let show: number | null = $state(null);
	function toggle(i: number) {
		show = show === i ? null : i;
	}

	function clearValidation() {
		validationStore.clear();
		show = null;
	}

	let hasIssues = $derived(validationStore.issues.length > 0);
</script>

<div class="flex w-full flex-col gap-2 p-2">
	{#if hasIssues}
		<!-- Header: количество issues + кнопка «Очистить». Стиль выровнен
		     с DiagramToolbar — gray-glass + border + backdrop-blur. -->
		<div
			class="flex items-center gap-2 rounded-md border border-gray bg-gray-glass p-2 backdrop-blur-xs"
		>
			<span class="flex items-center gap-1 text-xs">
				<span class="inline-block size-2 rounded-full bg-red"></span>
				<span class="tabular-nums">{validationStore.errors.length}</span>
			</span>
			<span class="flex items-center gap-1 text-xs">
				<span class="inline-block size-2 rounded-full bg-yellow"></span>
				<span class="tabular-nums">{validationStore.warnings.length}</span>
			</span>
			<button
				type="button"
				onclick={clearValidation}
				title={i18n.t('alerts.clear')}
				aria-label={i18n.t('alerts.clear')}
				class="click ml-auto rounded-sm p-1 transition-colors hover:bg-gray hover:text-accent"
			>
				<Icon name="cross" />
			</button>
		</div>
	{:else}
		<!-- Пустое состояние — нет issues. Тон спокойный, без иконок-
		     алертов: пользователь не должен волноваться при чистой
		     диаграмме. -->
		<div
			class="flex items-center gap-2 rounded-md border border-gray bg-gray-glass p-3 text-xs opacity-60 backdrop-blur-xs"
		>
			<Icon name="check" />
			<span>{i18n.t('alerts.empty')}</span>
		</div>
	{/if}

	{#each validationAlerts as a, i (a.key)}
		<button type="button" onclick={() => toggle(i)} class="click w-full text-left">
			<Alert title={a.title} text={a.text} type={a.type} show={show === i} />
		</button>
	{/each}
</div>
