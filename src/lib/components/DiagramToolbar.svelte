<script lang="ts">
	import Search from './Search.svelte';
	import Icon from './Icon.svelte';
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
	class="p- fixed top-3 left-1/2 z-4 flex w-[min(440px,90vw)] -translate-x-1/2 items-center gap-2 rounded-md border border-gray bg-gray-glass backdrop-blur-xs"
>
	<span
		title={i18n.t('diagram.toolbar.zoom')}
		class="ml-2 flex w-12 justify-center text-sm tabular-nums opacity-60 select-none"
		data-testid="zoom-indicator"
	>
		{zoom}%
	</span>
	<div class="flex-1 border-x border-gray">
		<Search />
	</div>
	<button
		type="button"
		onclick={toggleGravity}
		title={gravityTitle}
		aria-label={gravityTitle}
		aria-pressed={!gravityEnabled}
		class={`click rounded-sm p-1 transition-colors ${!gravityEnabled ? 'bg-gray-glass' : 'hover:bg-gray-glass'}`}
	>
		<Icon name="center" />
	</button>
	<button
		type="button"
		onclick={onUntangle}
		title={i18n.t('diagram.untangle.title')}
		aria-label={i18n.t('diagram.untangle.title')}
		class="click mr-2 size-7 rounded-md p-1.5 transition-colors hover:bg-gray hover:text-accent"
	>
		<Icon name="al" />
	</button>
</div>
