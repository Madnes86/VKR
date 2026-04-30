// Сигнал «открой имя свежесозданного объекта/связи в редакторе сразу
// при следующем маунте». Используется ContextMenu.create и операцией
// drag-link для создания link — чтобы пользователь не лез в режим
// переименования вручную, а сразу печатал имя поверх дефолтного.
//
// Контракт: одноразовый. claim(id, kind) забирает запись и сбрасывает.

export type EditKind = 'object' | 'link';

interface Pending {
	id: number;
	kind: EditKind;
}

class PendingNameEditStore {
	#data: Pending | null = $state(null);

	get id(): number | null {
		return this.#data?.id ?? null;
	}
	get kind(): EditKind | null {
		return this.#data?.kind ?? null;
	}

	request(id: number, kind: EditKind = 'object') {
		this.#data = { id, kind };
	}

	/** Если pending именно эта пара (id, kind) — забираем и очищаем стор.
	 * Возвращает true, если объект/связь должны открыться в edit-mode. */
	claim(id: number, kind: EditKind = 'object'): boolean {
		if (!this.#data) return false;
		if (this.#data.id !== id || this.#data.kind !== kind) return false;
		this.#data = null;
		return true;
	}

	clear() {
		this.#data = null;
	}
}

export const pendingNameEdit = new PendingNameEditStore();
