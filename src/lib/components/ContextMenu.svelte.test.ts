import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { flushSync } from 'svelte';
import ContextMenu from './ContextMenu.svelte';
import { contextStore } from '$lib/stores/context.svelte';
import { objects } from '$lib/stores/objects.svelte';

beforeEach(() => {
	objects.clear();
	contextStore.close();
});

afterEach(() => {
	objects.clear();
	contextStore.close();
});

function openFor(id: number, x = 100, y = 100) {
	const e = new MouseEvent('contextmenu', { clientX: x, clientY: y });
	contextStore.set(e, id);
	flushSync();
}

function btnByText(container: Element, text: string): HTMLButtonElement | null {
	const buttons = Array.from(container.querySelectorAll('[data-testid="context-menu"] button'));
	return (buttons.find((b) => b.textContent?.trim() === text) ?? null) as HTMLButtonElement | null;
}

describe('ContextMenu — открытие/закрытие', () => {
	it('Меню скрыто пока contextStore.isOpen=false', () => {
		const { container } = render(ContextMenu);
		expect(container.querySelector('[data-testid="context-menu"]')).toBeNull();
	});

	it('После set() меню рендерится', () => {
		const { container } = render(ContextMenu);
		openFor(0);
		expect(container.querySelector('[data-testid="context-menu"]')).not.toBeNull();
	});

	it('Для id=0 (корень) видна только кнопка «Добавить»', () => {
		const { container } = render(ContextMenu);
		openFor(0);
		const buttons = container.querySelectorAll('[data-testid="context-menu"] button');
		expect(buttons.length).toBe(1);
		expect(buttons[0].textContent?.trim()).toBe('Добавить объект');
	});
});

describe('ContextMenu — CRUD', () => {
	it('Create: «Добавить объект» добавляет в стор и закрывает меню', () => {
		const { container } = render(ContextMenu);
		openFor(0);
		const before = objects.all.length;
		btnByText(container, 'Добавить объект')!.click();
		flushSync();
		expect(objects.all.length).toBe(before + 1);
		expect(contextStore.isOpen).toBe(false);
	});

	it('Create: parent=id, если открыто на конкретном объекте', () => {
		objects.setAll([{ id: 5, name: 'parent', type: 'default', parent: null, content: null }]);
		const { container } = render(ContextMenu);
		openFor(5);
		btnByText(container, 'Добавить объект')!.click();
		flushSync();
		const created = objects.all.find((o) => o.parent === 5);
		expect(created).toBeDefined();
	});

	it('Update name: rename через prompt пишет новое имя', () => {
		objects.setAll([{ id: 7, name: 'old', type: 'default', parent: null, content: null }]);
		const promptSpy = vi.spyOn(window, 'prompt').mockReturnValue('new name');
		const { container } = render(ContextMenu);
		openFor(7);
		btnByText(container, 'переименовать')!.click();
		flushSync();
		expect(objects.get(7)?.name).toBe('new name');
		promptSpy.mockRestore();
	});

	it('Update name: prompt отменён — имя не меняется', () => {
		objects.setAll([{ id: 8, name: 'keep', type: 'default', parent: null, content: null }]);
		const promptSpy = vi.spyOn(window, 'prompt').mockReturnValue(null);
		const { container } = render(ContextMenu);
		openFor(8);
		btnByText(container, 'переименовать')!.click();
		flushSync();
		expect(objects.get(8)?.name).toBe('keep');
		promptSpy.mockRestore();
	});

	it('Update name: пустая строка не применяется', () => {
		objects.setAll([{ id: 9, name: 'keep', type: 'default', parent: null, content: null }]);
		const promptSpy = vi.spyOn(window, 'prompt').mockReturnValue('   ');
		const { container } = render(ContextMenu);
		openFor(9);
		btnByText(container, 'переименовать')!.click();
		flushSync();
		expect(objects.get(9)?.name).toBe('keep');
		promptSpy.mockRestore();
	});

	it('Update type: «обычный тип» меняет type на default', () => {
		objects.setAll([{ id: 10, name: 'x', type: 'interface', parent: null, content: null }]);
		const { container } = render(ContextMenu);
		openFor(10);
		btnByText(container, 'обычный тип')!.click();
		flushSync();
		expect(objects.get(10)?.type).toBe('default');
	});

	it('Toggle component: default → component', () => {
		objects.setAll([{ id: 11, name: 'x', type: 'default', parent: null, content: null }]);
		const { container } = render(ContextMenu);
		openFor(11);
		btnByText(container, 'сделать сущностью')!.click();
		flushSync();
		expect(objects.get(11)?.type).toBe('component');
	});

	it('Toggle component: component → default через «Убрать сущность»', () => {
		objects.setAll([{ id: 12, name: 'x', type: 'component', parent: null, content: null }]);
		const { container } = render(ContextMenu);
		openFor(12);
		btnByText(container, 'убрать сущность')!.click();
		flushSync();
		expect(objects.get(12)?.type).toBe('default');
	});

	it('Duplicate: создаёт копию с тем же type/parent и суффиксом в имени', () => {
		objects.setAll([{ id: 13, name: 'A', type: 'interface', parent: null, content: { foo: 1 } }]);
		const { container } = render(ContextMenu);
		openFor(13);
		btnByText(container, 'дублировать')!.click();
		flushSync();
		const copy = objects.all.find((o) => o.id !== 13 && o.name.startsWith('A '));
		expect(copy).toBeDefined();
		expect(copy!.type).toBe('interface');
		expect(copy!.parent).toBeNull();
	});

	it('Delete: удаляет объект из стора', () => {
		objects.setAll([{ id: 14, name: 'x', type: 'default', parent: null, content: null }]);
		const { container } = render(ContextMenu);
		openFor(14);
		btnByText(container, 'удалить')!.click();
		flushSync();
		expect(objects.get(14)).toBeUndefined();
	});

	it('Любое CRUD-действие закрывает меню', () => {
		objects.setAll([{ id: 15, name: 'x', type: 'default', parent: null, content: null }]);
		const { container } = render(ContextMenu);
		openFor(15);
		btnByText(container, 'удалить')!.click();
		flushSync();
		expect(contextStore.isOpen).toBe(false);
	});
});
