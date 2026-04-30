import { fetchState } from '$lib/functions/backend';
import type { IFlatObject, IFlatLink } from '$lib/interface';
import { buildTree } from '$lib/functions/other';
import { syncQueue } from '$lib/stores/sync.svelte';

function remapId(id: number, idMap: Record<string, number>): number {
	if (id < 0) {
		const real = idMap[String(id)];
		if (real !== undefined) return real;
	}
	return id;
}

// ---------------------------------------------------------------------------
// localStorage-зеркало диаграммы.
//
// Зачем: гость не вызывает projectStore.load(), и server-sync для него не
// работает (нет id), поэтому без локального бэкапа объекты/связи теряются
// после перезагрузки страницы. Авторизованным пользователям это тоже
// полезно как страховка от сетевых сбоев — на следующем заходе можно
// восстановить состояние, даже если сервер недоступен.
//
// Контракт: каждая мутация в ObjectsStore/LinksStore зеркалируется в
// localStorage. bootstrapDiagram() поднимает state — сначала с сервера,
// при его отсутствии или пустоте — из локального бэкапа.
// ---------------------------------------------------------------------------

const OBJECTS_KEY = 'diagram.objects.v1';
const LINKS_KEY = 'diagram.links.v1';

function lsGet(key: string): string | null {
	if (typeof localStorage === 'undefined') return null;
	try {
		return localStorage.getItem(key);
	} catch {
		return null;
	}
}
function lsSet(key: string, value: string): void {
	if (typeof localStorage === 'undefined') return;
	try {
		localStorage.setItem(key, value);
	} catch {
		/* quota — игнорируем */
	}
}

export class ObjectsStore {
	#objects: IFlatObject[] = $state([]);
	#tmpCounter = -1;

	get all() {
		return this.#objects;
	}

	async load() {
		const state = await fetchState();
		if (state) {
			this.#objects = state.objects;
			links.setAll(state.links);
			this.#persist();
		}
	}
	setAll(next: IFlatObject[]) {
		this.#objects = next;
		this.#persist();
	}
	get(id: number) {
		return this.#objects.find((o) => o.id === id);
	}
	clear() {
		this.#objects = [];
		this.#tmpCounter = -1;
		this.#persist();
	}

	/** Создаёт объект локально с tmp-id и пушит create в очередь. Возвращает tmp-id. */
	create(data: {
		name: string;
		type?: string;
		parent?: number | null;
		content?: Record<string, unknown> | null;
	}): number {
		const id = this.#tmpCounter--;
		const obj: IFlatObject = {
			id,
			name: data.name,
			type: data.type ?? 'default',
			parent: data.parent ?? null,
			content: data.content ?? null
		};
		this.#objects.push(obj);
		syncQueue.enqueueObjectCreate(id, {
			name: obj.name,
			type: obj.type,
			parent: obj.parent,
			content: obj.content
		});
		this.#persist();
		return id;
	}

	update(id: number, patch: Partial<IFlatObject>) {
		const idx = this.#objects.findIndex((o) => o.id === id);
		if (idx === -1) return;
		this.#objects[idx] = { ...this.#objects[idx], ...patch };

		const { id: _ignore, ...diff } = patch;
		syncQueue.enqueueObjectUpdate(id, diff);
		this.#persist();
	}

	updateType(id: number, newType: string) {
		this.update(id, { type: newType });
	}
	updateContent(id: number, content: Record<string, unknown> | null) {
		this.update(id, { content });
	}

	remove(id: number) {
		this.#objects = this.#objects.filter((o) => o.id !== id);
		syncQueue.enqueueObjectDelete(id);
		this.#persist();
	}

	/** Применяет карту tmp→real id от сервера. */
	applyIdMap(idMap: Record<string, number>) {
		this.#objects = this.#objects.map((o) => ({
			...o,
			id: remapId(o.id, idMap),
			parent: o.parent !== null ? remapId(o.parent, idMap) : null
		}));
		this.#persist();
	}

	/** Локальный снимок для восстановления при следующей загрузке. */
	#persist() {
		lsSet(OBJECTS_KEY, JSON.stringify(this.#objects));
	}

	/** Поднять состояние из localStorage. Используется bootstrapDiagram-ом
	 * как fallback, когда сервер пуст или недоступен. */
	restoreFromLocal(): boolean {
		const raw = lsGet(OBJECTS_KEY);
		if (!raw) return false;
		try {
			const parsed = JSON.parse(raw);
			if (Array.isArray(parsed)) {
				this.#objects = parsed;
				return true;
			}
		} catch {
			/* мусор в storage — игнорируем */
		}
		return false;
	}
}

export class LinksStore {
	#links: IFlatLink[] = $state([]);
	#tmpCounter = -1;

	get all() {
		return this.#links;
	}
	setAll(next: IFlatLink[]) {
		this.#links = next;
		this.#persist();
	}
	get(id: number) {
		return this.#links.find((l) => l.id === id);
	}
	clear() {
		this.#links = [];
		this.#tmpCounter = -1;
		this.#persist();
	}

	create(data: {
		name: string;
		type?: string;
		is: number;
		to: number;
		isValue?: boolean;
		toValue?: boolean;
	}): number {
		const id = this.#tmpCounter--;
		const link: IFlatLink = {
			id,
			name: data.name,
			type: data.type ?? 'default',
			is: data.is,
			to: data.to,
			isValue: data.isValue ?? false,
			toValue: data.toValue ?? true
		};
		this.#links.push(link);
		syncQueue.enqueueLinkCreate(id, {
			name: link.name,
			type: link.type,
			is: link.is,
			to: link.to,
			isValue: link.isValue,
			toValue: link.toValue
		});
		this.#persist();
		return id;
	}

	update(id: number, patch: Partial<IFlatLink>) {
		const idx = this.#links.findIndex((l) => l.id === id);
		if (idx === -1) return;
		this.#links[idx] = { ...this.#links[idx], ...patch };
		const { id: _ignore, ...diff } = patch;
		syncQueue.enqueueLinkUpdate(id, diff);
		this.#persist();
	}

	remove(id: number) {
		this.#links = this.#links.filter((l) => l.id !== id);
		syncQueue.enqueueLinkDelete(id);
		this.#persist();
	}

	applyIdMap(idMap: Record<string, number>) {
		this.#links = this.#links.map((l) => ({
			...l,
			id: remapId(l.id, idMap),
			is: remapId(l.is, idMap),
			to: remapId(l.to, idMap)
		}));
		this.#persist();
	}

	#persist() {
		lsSet(LINKS_KEY, JSON.stringify(this.#links));
	}

	restoreFromLocal(): boolean {
		const raw = lsGet(LINKS_KEY);
		if (!raw) return false;
		try {
			const parsed = JSON.parse(raw);
			if (Array.isArray(parsed)) {
				this.#links = parsed;
				return true;
			}
		} catch {
			/* мусор в storage — игнорируем */
		}
		return false;
	}
}

export const objects = new ObjectsStore();
export const links = new LinksStore();

// Сервер вернул id_map → переписать локальные tmp-id.
syncQueue.onIdMapApplied = (idMap) => {
	objects.applyIdMap(idMap);
	links.applyIdMap(idMap);
};

/**
 * Поднять состояние диаграммы при заходе на /app.
 *
 * Server-first: если есть авторизованный токен и сервер вернул state —
 * берём его, локальный кэш перезатирается. Если сервер пустой/нет
 * токена — пробуем локальный бэкап. Это тот же паттерн, что у
 * Editor: гость не теряет диаграмму при перезагрузке, авторизованный
 * получает страховку от сетевых сбоев.
 */
export async function bootstrapDiagram(): Promise<void> {
	let serverHadData = false;
	try {
		const state = await fetchState();
		if (state && (state.objects.length > 0 || state.links.length > 0)) {
			objects.setAll(state.objects);
			links.setAll(state.links);
			serverHadData = true;
		}
	} catch {
		// сетевой/auth-сбой — fall through на локальный бэкап
	}
	if (!serverHadData) {
		objects.restoreFromLocal();
		links.restoreFromLocal();
	}
}

class SelectedStore {
	selected: string | null = $state<any>(null);
	hover: string | null = $state<any>(null);

	set(key: 'selected' | 'hover', id: string) {
		this[key] = id;
	}
	clear(key: 'selected' | 'hover') {
		this[key] = null;
	}
}
export const selectedStore = new SelectedStore();

class ViewStore {
	view: number = $state(0);

	set(id: number) {
		this.view = id;
	}
	clear() {
		this.view = 0;
	}
}
export const viewStore = new ViewStore();

class TreeStore {
	#data = $derived.by(() => {
		return buildTree(viewStore.view, objects, links);
	});

	get all() {
		return this.#data;
	}
}
export const treeStore = new TreeStore();
