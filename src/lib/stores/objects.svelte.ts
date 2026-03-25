import { getObjects, getLinks } from "$lib/functions/backend";
import type { IFlatObject, ILink } from '$lib/interface';
import { buildTree } from '$lib/functions/other';

// TODO: Возможно стоит убрать null?
export class ObjectsStore {
    #objects: IFlatObject[] = $state([]);

    get all() { return this.#objects }
    async fetch() {
        const data = await getObjects();
        this.#objects = data;
    }
    get(id: number) { return this.#objects.find(o => o.id === id)}
    add(new_o: IFlatObject) { this.#objects.push(new_o) }
    update(id: number, new_o: Partial<IFlatObject>) {
        const index = this.#objects.findIndex(o => o.id === id);
        if (index !== -1) {
            this.#objects[index] = { ...this.#objects[index], ...new_o };
        }
    }
    updateType(id: number, newType: string) {
        const o = this.get(id);
        if (!o) return;
        const newO = {
            ...o,
            type: newType
        }
        this.update(id, newO);
    }
    up(id: number) {
        const o = this.get(id)
        if (!o) return;
        const newO = {
            ...o,
            parent : o.parent != null ? o.parent -1 : null
        }
        this.update(id, newO);
    }
    down(id: number) {
        const o = this.get(id)
        if (!o) return;
        const newO = {
            ...o,
            parent : o.parent != null ? o.parent +1 : null
        }
        this.update(id, newO);
    }
    
    remove(id: number) {
        this.#objects = this.#objects.filter(o => o.id !== id);
    }
    clear() { this.#objects = [] }
}
export const objects = new ObjectsStore();

export class LinksStore {
    #links: ILink[] = $state([]);

    get all() { return this.#links }
    async fetch() {
        const data = await getLinks();
        this.#links = data;
    }
}
export const links = new LinksStore();

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

async function init() {
    await objects.fetch();
    await links.fetch();
}
init();