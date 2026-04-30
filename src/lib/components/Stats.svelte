<script lang="ts">
	import { objects, links } from '$lib/stores/objects.svelte';
	import { validationStore } from '$lib/stores/validation.svelte';
	import { APP_VERSION } from '$lib/version';
	import { i18n } from '$lib/i18n';

	const issuesCount = $derived(validationStore.issues.length);
	const objectsCount = $derived(objects.all.length);
	const linksCount = $derived(links.all.length);
	// «Сущность» = объект, помеченный type='component' (см. Entityes.svelte).
	const entitiesCount = $derived(objects.all.filter((o) => o.type === 'component').length);
</script>

<div
	class="flex shrink-0 flex-col gap-0.5 border-t-2 border-gray bg-gray-glass p-2 text-[10px] leading-tight opacity-60 select-none"
	data-testid="sidebar-stats"
>
	<div class="flex items-center justify-between">
		<span>{i18n.t('stats.warnings')}</span>
		<span class="tabular-nums">{issuesCount}</span>
	</div>
	<div class="flex items-center justify-between">
		<span>{i18n.t('stats.objects')}</span>
		<span class="tabular-nums">{objectsCount}</span>
	</div>
	<div class="flex items-center justify-between">
		<span>{i18n.t('stats.links')}</span>
		<span class="tabular-nums">{linksCount}</span>
	</div>
	<div class="flex items-center justify-between">
		<span>{i18n.t('stats.entities')}</span>
		<span class="tabular-nums">{entitiesCount}</span>
	</div>
	<div class="mt-1 flex items-center justify-between border-t border-gray pt-1">
		<span>{i18n.t('stats.version')}</span>
		<span class="tabular-nums">{APP_VERSION}</span>
	</div>
</div>
