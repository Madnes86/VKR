// Сигнал «положи свежесозданный объект сюда» для drop-операций
// (drag-and-drop из дерева/компонентов на Canvas). Без этого Canvas
// $effect разместил бы новый объект в центре через centerObjects —
// вне зависимости от того, куда пользователь его кинул.
//
// Контракт: одноразовый. Canvas.claim(id) забирает координаты и
// очищает запись.

interface Pos {
	x: number;
	y: number;
}

class PendingDropStore {
	#positions: Map<number, Pos> = new Map();

	request(id: number, x: number, y: number) {
		this.#positions.set(id, { x, y });
	}

	claim(id: number): Pos | null {
		const p = this.#positions.get(id);
		if (!p) return null;
		this.#positions.delete(id);
		return p;
	}

	clear() {
		this.#positions.clear();
	}
}

export const pendingDrop = new PendingDropStore();
