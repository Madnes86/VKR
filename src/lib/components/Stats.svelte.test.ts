import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import Stats from './Stats.svelte';
import { render } from 'vitest-browser-svelte';
import { objects, links } from '$lib/stores/objects.svelte';
import { validationStore } from '$lib/stores/validation.svelte';
import pkg from '../../../package.json';

beforeEach(() => {
	objects.clear();
	links.clear();
	validationStore.clear();
});

afterEach(() => {
	objects.clear();
	links.clear();
	validationStore.clear();
});

function rows(container: Element) {
	return Array.from(container.querySelectorAll('[data-testid="sidebar-stats"] > div'));
}

describe('Stats — счётчики и версия', () => {
	it('Все строки рендерятся: warnings/objects/links/entities/version', () => {
		const { container } = render(Stats);
		const r = rows(container);
		// 5 секций — по одной на каждый показатель.
		expect(r.length).toBe(5);
	});

	it('Версия берётся из package.json', () => {
		const { container } = render(Stats);
		const html = container.querySelector('[data-testid="sidebar-stats"]')?.textContent ?? '';
		expect(html).toContain(pkg.version);
	});

	it('Пустой проект — все счётчики 0', () => {
		const { container } = render(Stats);
		const text = container.querySelector('[data-testid="sidebar-stats"]')?.textContent ?? '';
		// Версия не считается счётчиком; ожидаем хотя бы 4 нуля
		// (warnings/objects/links/entities).
		const zeros = (text.match(/\b0\b/g) ?? []).length;
		expect(zeros).toBeGreaterThanOrEqual(4);
	});

	it('Сущности — это объекты type="component"', () => {
		objects.setAll([
			{ id: 1, name: 'a', type: 'default', parent: null, content: null },
			{ id: 2, name: 'b', type: 'component', parent: null, content: null },
			{ id: 3, name: 'c', type: 'component', parent: null, content: null }
		]);
		const { container } = render(Stats);
		const r = rows(container);
		// Четвёртая строка — Сущностей
		expect(r[3].textContent).toContain('2');
	});
});
