import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { flushSync } from 'svelte';
import ContextMenu from './ContextMenu.svelte';
import { contextStore } from '$lib/stores/context.svelte';
import { objects, links, selectedStore } from '$lib/stores/objects.svelte';
import { pendingNameEdit } from '$lib/stores/pendingEdit.svelte';

beforeEach(() => {
	objects.clear();
	links.clear();
	contextStore.close();
	selectedStore.clearAll();
	pendingNameEdit.clear();
});

afterEach(() => {
	objects.clear();
	links.clear();
	contextStore.close();
	selectedStore.clearAll();
	pendingNameEdit.clear();
});

function open(id: number, kind: 'canvas' | 'object' | 'link' = 'canvas') {
	const e = new MouseEvent('contextmenu', { clientX: 100, clientY: 100 });
	contextStore.set(e, id, kind);
	flushSync();
}

function buttons(container: Element) {
	return Array.from(
		container.querySelectorAll('[data-testid="context-menu"] button')
	) as HTMLButtonElement[];
}
function btnByText(container: Element, text: string) {
	return buttons(container).find((b) => b.textContent?.trim() === text) ?? null;
}

describe('ContextMenu — переключение по kind', () => {
	it('kind=canvas: только «Добавить объект»', () => {
		const { container } = render(ContextMenu);
		open(0, 'canvas');
		const bs = buttons(container);
		expect(bs.length).toBe(1);
		expect(bs[0].textContent?.trim()).toBe('Добавить');
	});

	it('kind=object: показываются rename/тип/delete (без duplicate и interface)', () => {
		objects.setAll([{ id: 5, name: 'A', type: 'default', parent: null, content: null }]);
		const { container } = render(ContextMenu);
		open(5, 'object');
		expect(btnByText(container, 'Дочерний')).not.toBeNull();
		expect(btnByText(container, 'Переименовать')).not.toBeNull();
		expect(btnByText(container, 'Удалить')).not.toBeNull();
		// Удалённые опции — кнопок быть не должно.
		expect(btnByText(container, 'дублировать')).toBeNull();
		expect(btnByText(container, 'тип интерфейс')).toBeNull();
	});

	it('kind=link: rename / flip / delete', () => {
		links.setAll([
			{ id: 11, name: 'L', type: 'default', is: 1, to: 2, isValue: false, toValue: true }
		]);
		const { container } = render(ContextMenu);
		open(11, 'link');
		expect(btnByText(container, 'Переименовать')).not.toBeNull();
		expect(btnByText(container, 'Развернуть')).not.toBeNull();
		expect(btnByText(container, 'Удалить')).not.toBeNull();
		// Команд для объекта быть не должно.
		expect(btnByText(container, 'дублировать')).toBeNull();
	});

	it('Корневой data-kind="canvas" атрибут на меню', () => {
		const { container } = render(ContextMenu);
		open(0, 'canvas');
		const m = container.querySelector('[data-testid="context-menu"]') as HTMLElement;
		expect(m.dataset.kind).toBe('canvas');
	});
});

describe('ContextMenu — CRUD объектов', () => {
	it('Создание ребёнка при kind=object: parent=id', () => {
		objects.setAll([{ id: 5, name: 'P', type: 'default', parent: null, content: null }]);
		const { container } = render(ContextMenu);
		open(5, 'object');
		btnByText(container, 'Дочерний')!.click();
		flushSync();
		expect(objects.all.find((o) => o.parent === 5)).toBeDefined();
	});

	it('Tmp-id (id<0) тоже трактуется как объект, видны все кнопки', () => {
		objects.setAll([{ id: -1, name: 'tmp', type: 'default', parent: null, content: null }]);
		const { container } = render(ContextMenu);
		open(-1, 'object');
		expect(btnByText(container, 'Переименовать')).not.toBeNull();
		expect(btnByText(container, 'Удалить')).not.toBeNull();
	});

	it('Add child работает и для tmp-id (parent=отрицательный)', () => {
		objects.setAll([{ id: -3, name: 'tmp parent', type: 'default', parent: null, content: null }]);
		const { container } = render(ContextMenu);
		open(-3, 'object');
		btnByText(container, 'Дочерний')!.click();
		flushSync();
		expect(objects.all.find((o) => o.parent === -3)).toBeDefined();
	});

	it('Rename: новое имя действительно появляется в стора при следующем чтении', () => {
		objects.setAll([{ id: 30, name: 'old', type: 'default', parent: null, content: null }]);
		const promptSpy = vi.spyOn(window, 'prompt').mockReturnValue('renamed');
		const { container } = render(ContextMenu);
		open(30, 'object');
		btnByText(container, 'Переименовать')!.click();
		flushSync();
		// objects.all — свежая ссылка после update().
		expect(objects.all.find((o) => o.id === 30)?.name).toBe('renamed');
		promptSpy.mockRestore();
	});

	it('Rename: prompt пишет новое имя', () => {
		objects.setAll([{ id: 7, name: 'old', type: 'default', parent: null, content: null }]);
		const promptSpy = vi.spyOn(window, 'prompt').mockReturnValue('new');
		const { container } = render(ContextMenu);
		open(7, 'object');
		btnByText(container, 'Переименовать')!.click();
		flushSync();
		expect(objects.get(7)?.name).toBe('new');
		promptSpy.mockRestore();
	});

	it('Создание запрашивает inline-edit имени через pendingNameEdit', () => {
		const { container } = render(ContextMenu);
		open(0, 'canvas');
		btnByText(container, 'Добавить')!.click();
		flushSync();
		const created = objects.all[objects.all.length - 1];
		expect(pendingNameEdit.id).toBe(created.id);
	});

	it('Toggle component', () => {
		objects.setAll([{ id: 10, name: 'x', type: 'default', parent: null, content: null }]);
		const { container } = render(ContextMenu);
		open(10, 'object');
		btnByText(container, 'В сущность')!.click();
		flushSync();
		expect(objects.get(10)?.type).toBe('component');
	});

	it('Delete object', () => {
		objects.setAll([{ id: 12, name: 'x', type: 'default', parent: null, content: null }]);
		const { container } = render(ContextMenu);
		open(12, 'object');
		btnByText(container, 'Удалить')!.click();
		flushSync();
		expect(objects.get(12)).toBeUndefined();
	});
});

describe('ContextMenu — CRUD связей', () => {
	it('Rename link: prompt → links.update', () => {
		links.setAll([
			{ id: 20, name: 'old', type: 'default', is: 1, to: 2, isValue: false, toValue: true }
		]);
		const promptSpy = vi.spyOn(window, 'prompt').mockReturnValue('new');
		const { container } = render(ContextMenu);
		open(20, 'link');
		btnByText(container, 'Переименовать')!.click();
		flushSync();
		expect(links.get(20)?.name).toBe('new');
		promptSpy.mockRestore();
	});

	it('Flip link: меняет местами is/to и isValue/toValue', () => {
		links.setAll([
			{ id: 21, name: 'L', type: 'default', is: 1, to: 2, isValue: false, toValue: true }
		]);
		const { container } = render(ContextMenu);
		open(21, 'link');
		btnByText(container, 'Развернуть')!.click();
		flushSync();
		const l = links.get(21)!;
		expect(l.is).toBe(2);
		expect(l.to).toBe(1);
		expect(l.isValue).toBe(true);
		expect(l.toValue).toBe(false);
	});

	it('Delete link', () => {
		links.setAll([
			{ id: 22, name: 'L', type: 'default', is: 1, to: 2, isValue: false, toValue: true }
		]);
		const { container } = render(ContextMenu);
		open(22, 'link');
		btnByText(container, 'Удалить')!.click();
		flushSync();
		expect(links.get(22)).toBeUndefined();
	});
});

describe('ContextMenu — групповой режим', () => {
	function setupGroup() {
		objects.setAll([
			{ id: 100, name: 'A', type: 'default', parent: null, content: null },
			{ id: 101, name: 'B', type: 'default', parent: null, content: null },
			{ id: 102, name: 'C', type: 'default', parent: null, content: null }
		]);
		selectedStore.setMulti(['o + 100', 'o + 101', 'o + 102'], null);
	}

	it('Правый клик на объекте из группы → bulk-меню с count', () => {
		setupGroup();
		const { container } = render(ContextMenu);
		open(100, 'object');
		const indicator = container.querySelector('[data-testid="group-count"]');
		expect(indicator?.textContent).toContain('3');
		expect(btnByText(container, 'Удалить группу')).not.toBeNull();
		// Single-команды в группе не показываются.
		expect(btnByText(container, 'Переименовать')).toBeNull();
		// Дублирование убрано — кнопки нет ни в одиночном, ни в групповом меню.
		expect(btnByText(container, 'Дублировать группу')).toBeNull();
	});

	it('Правый клик на объекте ВНЕ группы → одиночное меню, даже если группа есть', () => {
		setupGroup();
		objects.setAll([
			...objects.all,
			{ id: 200, name: 'outside', type: 'default', parent: null, content: null }
		]);
		const { container } = render(ContextMenu);
		open(200, 'object');
		expect(btnByText(container, 'Переименовать')).not.toBeNull();
		expect(btnByText(container, 'Удалить группу')).toBeNull();
	});

	it('Bulk delete удаляет все выделенные объекты и сбрасывает группу', () => {
		setupGroup();
		const { container } = render(ContextMenu);
		open(100, 'object');
		btnByText(container, 'Удалить группу')!.click();
		flushSync();
		expect(objects.get(100)).toBeUndefined();
		expect(objects.get(101)).toBeUndefined();
		expect(objects.get(102)).toBeUndefined();
		expect(selectedStore.count).toBe(0);
	});
});
