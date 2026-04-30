import { describe, expect, it, beforeEach } from 'vitest';
import { selectedStore } from './objects.svelte';

beforeEach(() => {
	selectedStore.clearAll();
});

describe('selectedStore.toggleAtLevel — мульти-выделение в одном уровне', () => {
	it('Первый toggle создаёт группу и фиксирует groupParent', () => {
		selectedStore.toggleAtLevel('o + 1', null);
		expect(selectedStore.has('o + 1')).toBe(true);
		expect(selectedStore.count).toBe(1);
		expect(selectedStore.groupParent).toBeNull();
	});

	it('Второй toggle с тем же parent — добавляет в группу', () => {
		selectedStore.toggleAtLevel('o + 1', null);
		selectedStore.toggleAtLevel('o + 2', null);
		expect(selectedStore.count).toBe(2);
		expect(selectedStore.has('o + 1')).toBe(true);
		expect(selectedStore.has('o + 2')).toBe(true);
	});

	it('Повторный toggle того же id — убирает его из группы', () => {
		selectedStore.toggleAtLevel('o + 1', null);
		selectedStore.toggleAtLevel('o + 2', null);
		selectedStore.toggleAtLevel('o + 1', null);
		expect(selectedStore.has('o + 1')).toBe(false);
		expect(selectedStore.has('o + 2')).toBe(true);
		expect(selectedStore.count).toBe(1);
	});

	it('Toggle с другим parent — сбрасывает группу и стартует новую', () => {
		// Группа из двух root-объектов (parent=null).
		selectedStore.toggleAtLevel('o + 1', null);
		selectedStore.toggleAtLevel('o + 2', null);
		expect(selectedStore.count).toBe(2);

		// Shift+click по дочернему (parent=10) — другой уровень.
		selectedStore.toggleAtLevel('o + 5', 10);
		expect(selectedStore.count).toBe(1);
		expect(selectedStore.has('o + 5')).toBe(true);
		expect(selectedStore.has('o + 1')).toBe(false);
		expect(selectedStore.has('o + 2')).toBe(false);
		expect(selectedStore.groupParent).toBe(10);
	});

	it('После сброса можно собирать новую группу в новом уровне', () => {
		selectedStore.toggleAtLevel('o + 1', null);
		selectedStore.toggleAtLevel('o + 5', 10);
		selectedStore.toggleAtLevel('o + 6', 10);
		expect(selectedStore.count).toBe(2);
		expect(selectedStore.has('o + 5')).toBe(true);
		expect(selectedStore.has('o + 6')).toBe(true);
	});

	it('Обычный set("selected", id) сбрасывает groupParent', () => {
		selectedStore.toggleAtLevel('o + 1', null);
		selectedStore.toggleAtLevel('o + 2', null);
		selectedStore.set('selected', 'o + 99');
		expect(selectedStore.count).toBe(1);
		expect(selectedStore.groupParent).toBeNull();
	});
});
