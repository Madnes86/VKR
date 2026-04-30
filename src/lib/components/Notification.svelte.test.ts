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
	it('Прогресс-бар присутствует и его длительность анимации = duration', () => {
		const { container } = setup({ title: 't', duration: 7000 });
		const bar = container.querySelector('[data-testid="countdown"]') as HTMLElement;
		expect(bar).not.toBeNull();
		expect(bar.style.animationDuration).toBe('7000ms');
		expect(bar.style.animationPlayState).toBe('running');
	});

	it('Hover ставит прогресс-бар в paused, mouseleave — обратно в running', async () => {
		const { container } = setup({ title: 't', duration: 7000 });
		const card = container.querySelector('[role="status"]') as HTMLElement;
		const bar = container.querySelector('[data-testid="countdown"]') as HTMLElement;

		card.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
		flushSync();
		expect(bar.style.animationPlayState).toBe('paused');

		card.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
		flushSync();
		expect(bar.style.animationPlayState).toBe('running');
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
