<script lang="ts">
	import { objects, links } from '$lib/stores/objects.svelte';
	import { validationStore } from '$lib/stores/validation.svelte';
	import { side } from '$lib/stores/other.svelte';
	import { APP_VERSION } from '$lib/version';
	import { i18n } from '$lib/i18n';

	const issuesCount = $derived(validationStore.issues.length);
	const objectsCount = $derived(objects.all.length);
	const linksCount = $derived(links.all.length);
	// «Сущность» = объект, помеченный type='component' (см. Entityes.svelte).
	const entitiesCount = $derived(objects.all.filter((o) => o.type === 'component').length);

	// Позиционирование. Главный SideBar обычно слева; статистику ставим
	// в противоположный нижний угол, чтобы она не дралась с ним за
	// пространство. Если на противоположной стороне открыта вторая
	// панель — сдвигаем строку на её ширину, чтобы не залезть под неё.
	const mainSide = $derived(side.v.find((s) => s.main) ?? side.v[0]);
	const oppositePos = $derived(mainSide?.pos === 'r' ? 'l' : 'r');
	const oppositePanel = $derived(side.v.find((s) => s.pos === oppositePos));
	const oppositeOffset = $derived((oppositePanel?.width ?? 0) + 16);
	const positionStyle = $derived(
		oppositePos === 'r' ? `right: ${oppositeOffset}px;` : `left: ${oppositeOffset}px;`
	);
</script>

<div
	style={positionStyle}
	data-testid="sidebar-stats"
	data-pos={oppositePos}
	class="fixed bottom-3 z-3 flex items-center gap-3 rounded-md border border-gray bg-gray-glass px-3 py-1.5 text-[12px] leading-none opacity-60 backdrop-blur-xs select-none"
>
	<!--
		Когда есть хоть одна проблема, вся группа «Предупреждений N»
		подсвечивается жёлтым — пользователь замечает её даже если
		подсветка на канвасе отключена. Иначе цифра тонет в общем
		fade-фоне (opacity-60 на корне).
	-->
	<span
		class="flex items-center gap-1 {issuesCount > 0 ? 'text-yellow opacity-100' : ''}"
		data-testid="stats-warnings"
	>
		<span class={issuesCount > 0 ? '' : 'opacity-70'}>{i18n.t('stats.warnings')}</span>
		<span class="tabular-nums">{issuesCount}</span>
	</span>
	<span class="text-gray">·</span>
	<span class="flex items-center gap-1">
		<span class="opacity-70">{i18n.t('stats.objects')}</span>
		<span class="tabular-nums">{objectsCount}</span>
	</span>
	<span class="text-gray">·</span>
	<span class="flex items-center gap-1">
		<span class="opacity-70">{i18n.t('stats.links')}</span>
		<span class="tabular-nums">{linksCount}</span>
	</span>
	<span class="text-gray">·</span>
	<span class="flex items-center gap-1">
		<span class="opacity-70">{i18n.t('stats.entities')}</span>
		<span class="tabular-nums">{entitiesCount}</span>
	</span>
	<span class="text-gray">·</span>
	<span class="flex items-center gap-1">
		<span class="opacity-70">{i18n.t('stats.version')}</span>
		<span class="tabular-nums">{APP_VERSION}</span>
	</span>
</div>
