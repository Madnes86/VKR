import { getObjects, getLinks } from "$lib/functions/backend";
import type { IFlatObject, ITreeObject, ILink } from '$lib/interface';
import { buildTree } from '$lib/functions/build';

export class ObjectsStore {
    #objects: IFlatObject[] = $state([]);

    get all() {
        return this.#objects;
    }

    // Загрузка данных с сервера FastAPI
    async fetch() {
        const data = await getObjects();
        this.#objects = data;
    }
    update(id: number, new_o: Partial<IFlatObject>) {
        const index = this.#objects.findIndex(o => o.id === id);
        if (index !== -1) {
            this.#objects[index] = { ...this.#objects[index], ...new_o };
        }
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

async function init() {
    await objects.fetch();
    await links.fetch();
}
init();

// TODO: refactoring stores
class SelectedStore {
    selO: number | null = $state(null);
    selL: number | null = $state(null);
    hoverO: number | null = $state(null);
    hoverL: number | null = $state(null);

    set(key: 'selO' | 'selL' | 'hoverO' | 'hoverL', id: number) {
        this[key] = id;
    }
    clear(key: 'selO' | 'selL' | 'hoverO' | 'hoverL') {
        this[key] = null;
    }
}
export const selectedStore = new SelectedStore();

class ViewStore {
    view: number = $state(0);
    hover: number = $state(0);
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
    })
    get all() {
        return this.#data;
    }
}
export const treeStore = new TreeStore();