<script lang="ts">
	import Search from './Search.svelte';
	import Icon from './Icon.svelte';
	import { scaleStore } from '$lib/stores/scale.svelte';
	import { diagramSettings, DIAGRAM_DEFAULTS } from '$lib/stores/diagram.svelte';
	import { side } from '$lib/stores/other.svelte';
	import { validationStore } from '$lib/stores/validation.svelte';
	import { computeToolbarLayout } from '$lib/functions/toolbar';
	import { i18n } from '$lib/i18n';

	let {
		onUntangle,
		onValidate
	}: {
		onUntangle: () => void;
		onValidate: () => void;
	} = $props();

	let zoom = $derived(Math.round(scaleStore.value * 100));

	// Позиция toolbar учитывает открытые SideBar'ы: центрируем
	// по середине свободной области между ними, ширину сжимаем
	// до доступного пространства, иначе тулбар уезжает под панель
	// или вылезает за её край. Геометрия вынесена в чистую функцию
	// computeToolbarLayout — там же её и тестируем.
	let windowWidth: number = $state(0);
	let leftSide = $derived(side.v.find((s) => s.pos === 'l')?.width ?? 0);
	let rightSide = $derived(side.v.find((s) => s.pos === 'r')?.width ?? 0);
	let layout = $derived(computeToolbarLayout({ windowWidth, leftSide, rightSide }));

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

	// Кнопка валидации: подсветка активна — кнопка «нажата» (жёлтый
	// фон). Есть issues, но подсветка выключена — кнопка пульсирует,
	// привлекая внимание: «есть что показать, нажми меня».
	let hasIssues = $derived(validationStore.issues.length > 0);
	let validateActive = $derived(validationStore.highlight && hasIssues);
	let validatePulse = $derived(!validationStore.highlight && hasIssues);
</script>

<svelte:window bind:innerWidth={windowWidth} />

<div
	style="left: {layout.centerX}px; width: {layout.width}px;"
	class="fixed top-3 z-4 flex -translate-x-1/2 items-center gap-2 rounded-md border border-gray bg-gray-glass backdrop-blur-xs"
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
		onclick={onValidate}
		title={i18n.t('diagram.validate.title')}
		aria-label={i18n.t('diagram.validate.title')}
		aria-pressed={validateActive}
		data-testid="toolbar-validate"
		data-active={validateActive}
		data-pulse={validatePulse}
		class={[
			'click size-7 rounded-md p-1.5 transition-colors',
			validateActive ? 'bg-yellow text-black' : 'hover:bg-gray hover:text-yellow',
			validatePulse ? 'pulse-issue' : ''
		].join(' ')}
	>
		<Icon name="test16" />
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

<style>
	/* Нежная пульсация: жёлтое мягкое сияние «дышит» вокруг кнопки.
	   Используется когда есть issues, но подсветка ошибок ещё не
	   включена пользователем — привлекает внимание, не раздражая. */
	.pulse-issue {
		animation: pulse-issue 2s ease-in-out infinite;
	}
	@keyframes pulse-issue {
		0%,
		100% {
			box-shadow: 0 0 0 0 rgba(255, 247, 0, 0);
		}
		50% {
			box-shadow: 0 0 0 4px rgba(255, 247, 0, 0.35);
		}
	}
</style>
