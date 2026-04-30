import { describe, expect, it } from 'vitest';
import Slider from './Slider.svelte';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';

describe('Тестирование компонента Slider', () => {
	it('Отображает label и текущее значение', async () => {
		render(Slider, {
			props: { value: 0.5, min: 0, max: 1, step: 0.01, label: 'Test' }
		});
		await expect.element(page.getByText('Test')).toBeVisible();
		await expect.element(page.getByText('0.50')).toBeVisible();
	});

	it('Точность форматирования выводится из step (если не задана)', () => {
		const { container } = render(Slider, {
			props: { value: 100, min: 0, max: 1000, step: 5, label: 'Whole' }
		});
		// step=5 → 0 знаков после точки → "100"
		expect(container.textContent).toContain('100');
		expect(container.textContent).not.toContain('100.0');
	});

	it('Кастомная precision переопределяет step', () => {
		const { container } = render(Slider, {
			props: { value: 0.003, min: 0, max: 0.05, step: 0.0005, label: 'Spring', precision: 4 }
		});
		expect(container.textContent).toContain('0.0030');
	});

	it('input[type=range] принимает min/max/step', () => {
		const { container } = render(Slider, {
			props: { value: 5, min: 1, max: 10, step: 0.5, label: 'X' }
		});
		const input = container.querySelector('input[type="range"]') as HTMLInputElement;
		expect(input.min).toBe('1');
		expect(input.max).toBe('10');
		expect(input.step).toBe('0.5');
		expect(input.value).toBe('5');
	});

	it('aria-label берётся из label', () => {
		const { container } = render(Slider, {
			props: { value: 0, min: 0, max: 1, step: 0.1, label: 'Force' }
		});
		const input = container.querySelector('input[type="range"]')!;
		expect(input.getAttribute('aria-label')).toBe('Force');
	});
});
