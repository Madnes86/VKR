import { fetchState } from "$lib/functions/backend";
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

export class ObjectsStore {
    #objects: IFlatObject[] = $state([]);
    #tmpCounter = -1;

    get all() { return this.#objects }

    async load() {
        const state = await fetchState();
        if (state) {
            this.#objects = state.objects;
            links.setAll(state.links);
        }
    }
    setAll(next: IFlatObject[]) { this.#objects = next }
    get(id: number) { return this.#objects.find(o => o.id === id) }
    clear() { this.#objects = []; this.#tmpCounter = -1; }

    /** Создаёт объект локально с tmp-id и пушит create в очередь. Возвращает tmp-id. */
    create(data: { name: string; type?: string; parent?: number | null; content?: Record<string, unknown> | null }): number {
        const id = this.#tmpCounter--;
        const obj: IFlatObject = {
            id,
            name: data.name,
            type: data.type ?? 'default',
            parent: data.parent ?? null,
            content: data.content ?? null,
        };
        this.#objects.push(obj);
        syncQueue.enqueueObjectCreate(id, {
            name: obj.name,
            type: obj.type,
            parent: obj.parent,
            content: obj.content,
        });
        return id;
    }

    update(id: number, patch: Partial<IFlatObject>) {
        const idx = this.#objects.findIndex(o => o.id === id);
        if (idx === -1) return;
        this.#objects[idx] = { ...this.#objects[idx], ...patch };

        const { id: _ignore, ...diff } = patch;
        syncQueue.enqueueObjectUpdate(id, diff);
    }

    updateType(id: number, newType: string) { this.update(id, { type: newType }) }
    updateContent(id: number, content: Record<string, unknown> | null) { this.update(id, { content }) }

    remove(id: number) {
        this.#objects = this.#objects.filter(o => o.id !== id);
        syncQueue.enqueueObjectDelete(id);
    }

    /** Применяет карту tmp→real id от сервера. */
    applyIdMap(idMap: Record<string, number>) {
        this.#objects = this.#objects.map(o => ({
            ...o,
            id: remapId(o.id, idMap),
            parent: o.parent !== null ? remapId(o.parent, idMap) : null,
        }));
    }
}

export class LinksStore {
    #links: IFlatLink[] = $state([]);
    #tmpCounter = -1;

    get all() { return this.#links }
    setAll(next: IFlatLink[]) { this.#links = next }
    get(id: number) { return this.#links.find(l => l.id === id) }
    clear() { this.#links = []; this.#tmpCounter = -1; }

    create(data: { name: string; type?: string; is: number; to: number; isValue?: number; toValue?: number }): number {
        const id = this.#tmpCounter--;
        const link: IFlatLink = {
            id,
            name: data.name,
            type: data.type ?? 'default',
            is: data.is,
            to: data.to,
            isValue: data.isValue ?? 1,
            toValue: data.toValue ?? 1,
        };
        this.#links.push(link);
        syncQueue.enqueueLinkCreate(id, {
            name: link.name,
            type: link.type,
            is: link.is,
            to: link.to,
            isValue: link.isValue,
            toValue: link.toValue,
        });
        return id;
    }

    update(id: number, patch: Partial<IFlatLink>) {
        const idx = this.#links.findIndex(l => l.id === id);
        if (idx === -1) return;
        this.#links[idx] = { ...this.#links[idx], ...patch };
        const { id: _ignore, ...diff } = patch;
        syncQueue.enqueueLinkUpdate(id, diff);
    }

    remove(id: number) {
        this.#links = this.#links.filter(l => l.id !== id);
        syncQueue.enqueueLinkDelete(id);
    }

    applyIdMap(idMap: Record<string, number>) {
        this.#links = this.#links.map(l => ({
            ...l,
            id: remapId(l.id, idMap),
            is: remapId(l.is, idMap),
            to: remapId(l.to, idMap),
        }));
    }
}

export const objects = new ObjectsStore();
export const links = new LinksStore();

// Сервер вернул id_map → переписать локальные tmp-id.
syncQueue.onIdMapApplied = (idMap) => {
    objects.applyIdMap(idMap);
    links.applyIdMap(idMap);
};

class SelectedStore {
    selected: string | null = $state<any>(null);
    hover: string | null = $state<any>(null);

    set(key: 'selected' | 'hover', id: string) { this[key] = id }
    clear(key: 'selected' | 'hover') { this[key] = null }
}
export const selectedStore = new SelectedStore();

class ViewStore {
    view: number = $state(0);

    set(id: number) { this.view = id }
    clear() { this.view = 0 }
}
export const viewStore = new ViewStore();

class TreeStore {
    #data = $derived.by(() => {
        return buildTree(viewStore.view, objects, links);
    });

    get all() { return this.#data }
}
export const treeStore = new TreeStore();
