// «Черновик» связи: пользователь жмёт на кружочек выделенного объекта
// и тянет линию к другому объекту. Source-id фиксируется на mousedown,
// курсор обновляется на window mousemove, на mouseup Canvas проверяет
// hit-target и либо создаёт связь, либо отменяет драфт.
//
// Координаты в clientX/Y — те же, что и у физики (она работает в
// глобальных пикселях окна).

interface Draft {
	sourceId: number;
	x: number;
	y: number;
}

class LinkDraftStore {
	#draft: Draft | null = $state(null);
	#targetId: number | null = $state(null);
	// Стартовые координаты — отдельные нерактивные поля. Раньше Canvas
	// читал linkDraft.x/y в начале $effect и запоминал «начало», но
	// reactive-чтение подписывало эффект на х/y; каждый move()
	// перезапускал $effect, и start обнулялся до текущей точки —
	// порог промаха не срабатывал. Теперь startX/Y фиксируются в
	// start() и не обновляются до cancel().
	#startX = 0;
	#startY = 0;

	get active(): boolean {
		return this.#draft !== null;
	}
	get sourceId(): number | null {
		return this.#draft?.sourceId ?? null;
	}
	get x(): number {
		return this.#draft?.x ?? 0;
	}
	get y(): number {
		return this.#draft?.y ?? 0;
	}
	get startX(): number {
		return this.#startX;
	}
	get startY(): number {
		return this.#startY;
	}
	get targetId(): number | null {
		return this.#targetId;
	}

	start(sourceId: number, x: number, y: number) {
		this.#startX = x;
		this.#startY = y;
		this.#draft = { sourceId, x, y };
		this.#targetId = null;
	}
	move(x: number, y: number) {
		if (!this.#draft) return;
		this.#draft = { ...this.#draft, x, y };
	}
	setTarget(id: number) {
		if (!this.#draft) return;
		if (id === this.#draft.sourceId) return; // на себя связь не делаем
		this.#targetId = id;
	}
	clearTarget(id: number) {
		if (this.#targetId === id) this.#targetId = null;
	}
	cancel() {
		this.#draft = null;
		this.#targetId = null;
	}
}

export const linkDraft = new LinkDraftStore();
