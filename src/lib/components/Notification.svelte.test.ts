import { describe, expect, it } from 'vitest';
import Notification from './Notification.svelte';
import { render } from 'vitest-browser-svelte';

function setup(props: {
	icon?: string;
	title?: string;
	type?: 'success' | 'error' | 'info' | 'warning';
}) {
	return render(Notification, {
		props: { duration: 100000, ...props } // долго, чтобы не сработал авто-close
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
