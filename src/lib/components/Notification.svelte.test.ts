import { describe, expect, it, vi } from 'vitest';
import Notification from './Notification.svelte';
import { render } from 'vitest-browser-svelte';
import { flushSync } from 'svelte';

function setup(props: {
	icon?: string;
	title?: string;
	type?: 'success' | 'error' | 'info' | 'warning';
	duration?: number;
	onClose?: () => void;
}) {
	return render(Notification, {
		props: { duration: 100000, ...props } // длинный default, чтобы тест не падал по таймеру
	});
}

describe('Notification — стиль и палитра', () => {
	it('Заголовок отображается', () => {
		const { container } = setup({ title: 'Привет', type: 'info' });
		expect(container.querySelector('h3')?.textContent).toBe('Привет');
	});

	it('Карточка использует glass-токены проекта (gray-glass + border + backdrop-blur)', () => {
		const { container } = setup({ title: 'x', type: 'info' });
		const card = container.querySelector('div.flex.max-w-96') as HTMLElement;
		expect(card).not.toBeNull();
		expect(card.className).toContain('bg-gray-glass');
		expect(card.className).toContain('border-gray');
		expect(card.className).toContain('backdrop-blur-xs');
		expect(card.className).toContain('rounded-md');
	});

	it('success — иконка в фиолетовом круге (bg-accent)', () => {
		const { container } = setup({ title: 'ok', type: 'success' });
		const badge = container.querySelector('div.size-8') as HTMLElement;
		expect(badge.className).toContain('bg-accent');
	});

	it('error — иконка в красном круге (bg-red)', () => {
		const { container } = setup({ title: 'fail', type: 'error' });
		const badge = container.querySelector('div.size-8') as HTMLElement;
		expect(badge.className).toContain('bg-red');
	});

	it('warning — иконка в жёлтом круге (bg-yellow)', () => {
		const { container } = setup({ title: 'warn', type: 'warning' });
		const badge = container.querySelector('div.size-8') as HTMLElement;
		expect(badge.className).toContain('bg-yellow');
	});

	it('info — иконка в нейтральном круге (bg-gray)', () => {
		const { container } = setup({ title: 'info', type: 'info' });
		const badge = container.querySelector('div.size-8') as HTMLElement;
		expect(badge.className).toContain('bg-gray');
	});

	it('Есть кнопка закрытия с aria-label', () => {
		const { container } = setup({ title: 'x', type: 'info' });
		const btn = container.querySelector('button[aria-label="close"]');
		expect(btn).not.toBeNull();
	});
});

describe('Notification — обратный отсчёт и пауза', () => {
	it('Прогресс-бар присутствует и стартует на 100% (не paused)', () => {
		const { container } = setup({ title: 't', duration: 7000 });
		const bar = container.querySelector('[data-testid="countdown"]') as HTMLElement;
		expect(bar).not.toBeNull();
		expect(bar.dataset.paused).toBe('false');
		// progress = 1.0 в момент маунта (elapsed=0).
		expect(parseFloat(bar.dataset.progress!)).toBeCloseTo(1, 3);
	});

	it('Стаб matches(":hover") = true ставит data-paused=true и замораживает прогресс', async () => {
		const { container } = setup({ title: 't', duration: 400 });
		const card = container.querySelector('[role="status"]') as HTMLElement;
		const bar = container.querySelector('[data-testid="countdown"]') as HTMLElement;

		// Эмулируем hover: matches(':hover') опрашивается каждый tick.
		const originalMatches = card.matches.bind(card);
		(card as unknown as { matches: (s: string) => boolean }).matches = (s: string) =>
			s === ':hover' ? true : originalMatches(s);

		await new Promise((r) => setTimeout(r, 80));
		expect(bar.dataset.paused).toBe('true');
		const atPause = parseFloat(bar.dataset.progress!);

		await new Promise((r) => setTimeout(r, 120));
		const stillPaused = parseFloat(bar.dataset.progress!);
		// На паузе разница пренебрежимо мала (один тик допустим).
		expect(Math.abs(atPause - stillPaused)).toBeLessThan(0.15);
		expect(bar.dataset.paused).toBe('true');

		// Снимаем hover.
		(card as unknown as { matches: (s: string) => boolean }).matches = originalMatches;
		await new Promise((r) => setTimeout(r, 80));
		expect(bar.dataset.paused).toBe('false');
		const afterResume = parseFloat(bar.dataset.progress!);
		expect(afterResume).toBeLessThan(stillPaused);
	});

	it('Прогресс уменьшается во времени без hover', async () => {
		const { container } = setup({ title: 't', duration: 400 });
		const bar = container.querySelector('[data-testid="countdown"]') as HTMLElement;
		await new Promise((r) => setTimeout(r, 120));
		expect(parseFloat(bar.dataset.progress!)).toBeLessThan(1);
	});

	it('Клик по крестику вызывает onClose (после анимации скрытия)', async () => {
		const onClose = vi.fn();
		const { container } = setup({ title: 't', duration: 100000, onClose });
		const btn = container.querySelector('button[aria-label="close"]') as HTMLButtonElement;
		btn.click();
		flushSync();
		// onClose дёргается через 300мс slide-out — ждём с запасом.
		await new Promise((r) => setTimeout(r, 400));
		expect(onClose).toHaveBeenCalledTimes(1);
	});

	it('Авто-закрытие по таймеру вызывает onClose', async () => {
		const onClose = vi.fn();
		setup({ title: 't', duration: 50, onClose });
		await new Promise((r) => setTimeout(r, 50 + 350));
		expect(onClose).toHaveBeenCalledTimes(1);
	});
});
