// Контекстное меню разное для канваса, объекта и связи. Раньше стора
// хранила только id, и ContextMenu различал «корень» по id===0 — но
// объекты с tmp-id (отрицательные) тоже попадали в эту ветку, и
// меню для них показывало только «Добавить». Теперь храним явный
// kind, а условия в UI — по нему.

export type ContextKind = 'canvas' | 'object' | 'link';

export interface ContextData {
	x: number;
	y: number;
	id: number;
	kind: ContextKind;
}

class ContextStore {
	data: ContextData | null = $state(null);

	get isOpen() {
		return this.data !== null;
	}
	get x() {
		return this.data?.x ?? 0;
	}
	get y() {
		return this.data?.y ?? 0;
	}
	get id() {
		return this.data?.id ?? 0;
	}
	get kind(): ContextKind {
		return this.data?.kind ?? 'canvas';
	}

	set(e: MouseEvent, id: number, kind?: ContextKind) {
		e.preventDefault();
		e.stopPropagation();
		this.data = { x: e.clientX, y: e.clientY, id, kind: kind ?? 'canvas' };
	}

	close() {
		this.data = null;
	}
}
export const contextStore = new ContextStore();
