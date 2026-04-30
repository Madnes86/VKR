<script lang="ts">
	import { Alert, Button, Icon } from '$lib/components';
	import { alerts } from '$lib/stores/alert.svelte';
	import { searchStore } from '$lib/stores/search.svelte';
	import { validationStore } from '$lib/stores/validation.svelte';
	import { notificationStore } from '$lib/stores/notification.svelte';

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
				title: i.severity === 'error' ? 'Ошибка структуры' : 'Предупреждение',
				text: i.message,
				type: i.severity === 'error' ? ('error' as const) : ('alert' as const)
			}))
	);

	let filterAlerts = $derived.by(() => {
		return alerts.all.filter((e) => !query || e.title.includes(query));
	});

	let show: number | null = $state(1000);
	function toggle(i: number) {
		show = show === i ? null : i;
	}

	function runValidation() {
		const issues = validationStore.run();
		const errs = validationStore.errors.length;
		const warns = validationStore.warnings.length;
		if (issues.length === 0) {
			notificationStore.success('Проверка пройдена: ошибок не найдено');
		} else if (errs > 0) {
			notificationStore.error(`Найдено ${errs} ошибок, ${warns} предупреждений`);
		} else {
			notificationStore.show({
				icon: 'alert',
				title: `Найдено ${warns} предупреждений`,
				type: 'warning'
			});
		}
	}

	function clearValidation() {
		validationStore.clear();
	}
</script>

<div class="flex w-full flex-col gap-2 p-2">
	<div class="flex items-center gap-2">
		<Button
			onclick={runValidation}
			className="flex! items-center gap-2 px-2 py-1 rounded-md bg-accent text-white"
		>
			<Icon name="check" />
			<span>Проверить</span>
		</Button>
		{#if validationStore.issues.length > 0}
			<Button onclick={clearValidation} className="px-2 py-1 rounded-md border border-gray">
				Очистить
			</Button>
			<span class="ml-auto text-xs text-zinc-400">
				{validationStore.errors.length} ошибок · {validationStore.warnings.length} предупреждений
			</span>
		{/if}
	</div>

	{#each validationAlerts as a, i (a.key)}
		<Button onclick={() => toggle(i)} className="w-full">
			<Alert title={a.title} text={a.text} type={a.type} show={show === i} {query} />
		</Button>
	{/each}
</div>
