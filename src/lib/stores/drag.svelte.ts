import { writable } from 'svelte/store';

type IDrag = {
	ref: HTMLElement;
	id: number;
	offsetX: number;
	offsetY: number;
	startX: number;
	startY: number;
};

function createStore() {
	const { subscribe, set, update } = writable<IDrag | null>(null);
	return {
		subscribe,
		// Установить перетаскиваемый объект
		setDrag: (obj: IDrag) => set(obj),

		// Очистить перетаскиваемый объект
		clearDrag: () => set(null),
		hasValue: (): boolean => {
			let hasValue = false;
			subscribe((value) => {
				hasValue = value !== null;
			})();
			return hasValue;
		},
		getValue: (): IDrag | null => {
			let value: IDrag | null = null;
			subscribe((v) => (value = v))();
			return value;
		}
	};
}

export const dragStore = createStore();
