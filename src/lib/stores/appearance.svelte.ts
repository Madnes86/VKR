import { SvelteSet } from 'svelte/reactivity';

// Глобальный Set ID объектов, которые уже «появились» на холсте.
// Используется компонентами Canvas и Object для постепенного раскрытия
// дерева: каждый Object фильтрует своих детей по этому Set, поэтому
// раскрытие каскадно проходит через все уровни вложенности без явной
// координации между компонентами.
class AppearanceStore {
	revealed = new SvelteSet<number>();

	has(id: number): boolean {
		return this.revealed.has(id);
	}
	reveal(id: number): void {
		this.revealed.add(id);
	}
	// Удаляет из revealed всё, что не входит в keep (например, после
	// фильтра поиска или удаления объекта). Уже показанные ID,
	// которые остались в keep, сохраняются — анимация для них не
	// запускается повторно.
	forget(keep: Set<number>): void {
		for (const id of [...this.revealed]) {
			if (!keep.has(id)) this.revealed.delete(id);
		}
	}
	reset(): void {
		this.revealed.clear();
	}
}

export const appearanceStore = new AppearanceStore();
