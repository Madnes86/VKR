import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import Stats from './Stats.svelte';
import { render } from 'vitest-browser-svelte';
import { objects, links } from '$lib/stores/objects.svelte';
import { validationStore } from '$lib/stores/validation.svelte';
import { APP_VERSION } from '$lib/version';

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

function root(container: Element) {
	return container.querySelector('[data-testid="sidebar-stats"]') as HTMLElement;
}

describe('Stats — горизонтальная строка под Canvas', () => {
	it('Один data-testid контейнер с пятью группами счётчиков', () => {
		const { container } = render(Stats);
		const r = root(container);
		expect(r).not.toBeNull();
		// 5 групп = 5 <span class="flex items-center gap-1">
		const groups = r.querySelectorAll('span.flex.items-center');
		expect(groups.length).toBeGreaterThanOrEqual(5);
	});

	it('Версия отображается из APP_VERSION', () => {
		const { container } = render(Stats);
		expect(root(container).textContent).toContain(APP_VERSION);
	});

	it('Пустой проект — все счётчики 0', () => {
		const { container } = render(Stats);
		const text = root(container).textContent ?? '';
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
		expect(root(container).textContent).toMatch(/Сущност\S*\s*2/);
	});
});
