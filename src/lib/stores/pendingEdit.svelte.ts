// Сигнал «открой имя этого объекта в редакторе сразу при следующем
// маунте». Используется при создании нового объекта из ContextMenu —
// чтобы пользователь не лез в режим переименования вручную, а сразу
// печатал имя поверх дефолтного.
//
// Контракт: одноразовый — claim() забирает id и сбрасывает поле.

class PendingNameEditStore {
	#id: number | null = $state(null);

	get id() {
		return this.#id;
	}

	request(id: number) {
		this.#id = id;
	}

	/** Если pending именно этот id — забираем его и очищаем стор.
	 * Возвращает true, если объект должен сразу открыться в edit-mode. */
	claim(id: number): boolean {
		if (this.#id !== id) return false;
		this.#id = null;
		return true;
	}

	clear() {
		this.#id = null;
	}
}

export const pendingNameEdit = new PendingNameEditStore();
