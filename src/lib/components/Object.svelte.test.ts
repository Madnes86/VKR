import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import Object from './Object.svelte';
import { render } from 'vitest-browser-svelte';
import { flushSync } from 'svelte';
import { selectedStore } from '$lib/stores/objects.svelte';

beforeEach(() => {
	selectedStore.clear('selected');
	selectedStore.clear('hover');
});

afterEach(() => {
	selectedStore.clear('selected');
	selectedStore.clear('hover');
});

function makeProps(id = 1) {
	return {
		id,
		name: `obj-${id}`,
		type: 'default',
		x: 100,
		y: 100,
		size: 100,
		objects: [],
		links: [],
		selParent: false
	};
}

describe('Object — снятие выделения по клику снаружи', () => {
	it('Клик в body вне объекта снимает selectedStore.selected', () => {
		render(Object, { props: makeProps(1) });

		// Имитируем выделение этого объекта.
		selectedStore.set('selected', 'o + 1');
		flushSync();
		expect(selectedStore.selected).toBe('o + 1');

		// Клик по чужому элементу (body) должен очистить selection.
		const outside = document.body;
		outside.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, button: 0 }));
		flushSync();

		expect(selectedStore.selected).toBeNull();
	});

	it('Клик внутри выбранного объекта не снимает выделение', () => {
		const { container } = render(Object, { props: makeProps(2) });

		selectedStore.set('selected', 'o + 2');
		flushSync();

		const inner = container.querySelector('.absolute') as HTMLElement;
		expect(inner).not.toBeNull();
		inner.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, button: 0 }));
		flushSync();

		expect(selectedStore.selected).toBe('o + 2');
	});

	it('Без выделения слушатель не активен — клики снаружи не вызывают clear', () => {
		render(Object, { props: makeProps(3) });
		// selected не установлен — listener не подписан, никаких side-эффектов.
		document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, button: 0 }));
		flushSync();
		expect(selectedStore.selected).toBeNull();
	});
});
