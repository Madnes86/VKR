import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import DiagramToolbar from './DiagramToolbar.svelte';
import { render } from 'vitest-browser-svelte';
import { flushSync } from 'svelte';
import { scaleStore } from '$lib/stores/scale.svelte';
import { diagramSettings, DIAGRAM_DEFAULTS } from '$lib/stores/diagram.svelte';

beforeEach(() => {
	// Сбрасываем глобальные стора до дефолтов, чтобы тесты не влияли друг
	// на друга: оба стора singletons и переживают между кейсами.
	scaleStore.value = 1;
	diagramSettings.gravity = DIAGRAM_DEFAULTS.gravity;
});

afterEach(() => {
	diagramSettings.gravity = DIAGRAM_DEFAULTS.gravity;
});

describe('DiagramToolbar — индикатор зума', () => {
	it('Отображает текущий scale в процентах', async () => {
		scaleStore.value = 1.5;
		const { container } = render(DiagramToolbar, {
			props: { onUntangle: () => {}, onValidate: () => {} }
		});

		const indicator = container.querySelector('[data-testid="zoom-indicator"]');
		expect(indicator?.textContent?.trim()).toBe('150%');
	});

	it('Округляет дробные проценты', async () => {
		scaleStore.value = 1.234;
		const { container } = render(DiagramToolbar, {
			props: { onUntangle: () => {}, onValidate: () => {} }
		});

		const indicator = container.querySelector('[data-testid="zoom-indicator"]');
		expect(indicator?.textContent?.trim()).toBe('123%');
	});
});

describe('DiagramToolbar — toggle гравитации', () => {
	it('Клик по кнопке гравитации зануляет diagramSettings.gravity', async () => {
		const before = diagramSettings.gravity;
		expect(before).toBeGreaterThan(0);

		const { container } = render(DiagramToolbar, {
			props: { onUntangle: () => {}, onValidate: () => {} }
		});
		const btn = container.querySelector(
			'button[aria-label="Отключить гравитацию"]'
		) as HTMLButtonElement | null;
		expect(btn).not.toBeNull();
		btn!.click();

		expect(diagramSettings.gravity).toBe(0);
	});

	it('Повторный клик возвращает гравитацию к прежнему значению', async () => {
		diagramSettings.gravity = 0.0007;
		const { container } = render(DiagramToolbar, {
			props: { onUntangle: () => {}, onValidate: () => {} }
		});

		const offBtn = container.querySelector(
			'button[aria-label="Отключить гравитацию"]'
		) as HTMLButtonElement;
		flushSync(() => offBtn.click());
		expect(diagramSettings.gravity).toBe(0);

		const onBtn = container.querySelector(
			'button[aria-label="Включить гравитацию"]'
		) as HTMLButtonElement;
		expect(onBtn).not.toBeNull();
		flushSync(() => onBtn.click());

		expect(diagramSettings.gravity).toBeCloseTo(0.0007, 6);
	});

	it('При gravity=0 на старте кнопка показывает «Включить» и берёт backup из дефолтов', async () => {
		diagramSettings.gravity = 0;
		const { container } = render(DiagramToolbar, {
			props: { onUntangle: () => {}, onValidate: () => {} }
		});

		const onBtn = container.querySelector(
			'button[aria-label="Включить гравитацию"]'
		) as HTMLButtonElement | null;
		expect(onBtn).not.toBeNull();

		onBtn!.click();
		expect(diagramSettings.gravity).toBe(DIAGRAM_DEFAULTS.gravity);
	});
});

describe('DiagramToolbar — распутать связи', () => {
	it('Клик по кнопке вызывает onUntangle', async () => {
		const onUntangle = vi.fn();
		const { container } = render(DiagramToolbar, {
			props: { onUntangle, onValidate: () => {} }
		});

		const btn = container.querySelector(
			'button[aria-label="Перенести дальние эндпоинты ближе к их источнику"]'
		) as HTMLButtonElement | null;
		expect(btn).not.toBeNull();
		btn!.click();

		expect(onUntangle).toHaveBeenCalledTimes(1);
	});
});

describe('DiagramToolbar — проверить структуру', () => {
	it('Клик по кнопке валидации вызывает onValidate', () => {
		const onValidate = vi.fn();
		const { container } = render(DiagramToolbar, {
			props: { onUntangle: () => {}, onValidate }
		});

		const btn = container.querySelector(
			'button[aria-label="Проверить структуру диаграммы"]'
		) as HTMLButtonElement | null;
		expect(btn).not.toBeNull();
		btn!.click();

		expect(onValidate).toHaveBeenCalledTimes(1);
	});
});

describe('DiagramToolbar — поиск', () => {
	it('Search виден сразу — отдельной кнопки-toggle нет', () => {
		const { container } = render(DiagramToolbar, {
			props: { onUntangle: () => {}, onValidate: () => {} }
		});

		expect(container.querySelector('input[type="text"]')).not.toBeNull();
		expect(container.querySelector('button[aria-label="Поиск"]')).toBeNull();
	});
});

describe('DiagramToolbar — иконки и подписи', () => {
	it('У icon-кнопок (gravity, untangle) есть непустой title для tooltip', () => {
		const { container } = render(DiagramToolbar, {
			props: { onUntangle: () => {}, onValidate: () => {} }
		});

		const titled = Array.from(container.querySelectorAll('button[title]'));
		expect(titled.length).toBeGreaterThanOrEqual(2);
		for (const b of titled) {
			expect(b.getAttribute('title')?.length).toBeGreaterThan(0);
		}
	});
});
