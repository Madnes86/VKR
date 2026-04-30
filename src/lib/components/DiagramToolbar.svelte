<script lang="ts">
	import ButtonIcon from './ButtonIcon.svelte';
	import Search from './Search.svelte';
	import { scaleStore } from '$lib/stores/scale.svelte';
	import { diagramSettings, DIAGRAM_DEFAULTS } from '$lib/stores/diagram.svelte';
	import { i18n } from '$lib/i18n';

	let { onUntangle }: { onUntangle: () => void } = $props();

	let zoom = $derived(Math.round(scaleStore.value * 100));

	// Toggle гравитации: при выключении сохраняем текущее значение и
	// зануляем, при включении — восстанавливаем. Если на момент монтирования
	// гравитация уже 0 (например, после reload с persist), backup берём из
	// дефолтов, чтобы пользователь смог её включить.
	let gravityEnabled = $state(diagramSettings.gravity > 0);
	let gravityBackup =
		diagramSettings.gravity > 0 ? diagramSettings.gravity : DIAGRAM_DEFAULTS.gravity;

	function toggleGravity() {
		if (gravityEnabled) {
			gravityBackup = diagramSettings.gravity || gravityBackup;
			diagramSettings.gravity = 0;
			gravityEnabled = false;
		} else {
			diagramSettings.gravity = gravityBackup;
			gravityEnabled = true;
		}
		diagramSettings.persist();
	}

	let gravityTitle = $derived(
		gravityEnabled
			? i18n.t('diagram.toolbar.gravity.disable')
			: i18n.t('diagram.toolbar.gravity.enable')
	);
</script>

<div
	class="fixed top-5 left-1/2 z-4 flex w-[min(640px,90vw)] -translate-x-1/2 items-center gap-2 rounded-md border border-gray bg-gray-glass p-2"
>
	<span
		title={i18n.t('diagram.toolbar.zoom')}
		class="px-2 text-sm tabular-nums opacity-60 select-none"
		data-testid="zoom-indicator"
	>
		{zoom}%
	</span>
	<ButtonIcon name="orbit" title={gravityTitle} active={!gravityEnabled} onclick={toggleGravity} />
	<ButtonIcon name="line" title={i18n.t('diagram.untangle.title')} onclick={onUntangle} />
	<div class="flex-1">
		<Search />
	</div>
</div>
