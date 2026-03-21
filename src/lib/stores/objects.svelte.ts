import { writable } from 'svelte/store';
import { getObjects, getLinks } from "$lib/functions/backend";
import type { IFlatObject, ITreeObject, ILink } from '$lib/interface';

export let flatObjects: IFlatObject[] = [
    {id: 0, name: "root", parent: null},
    {id: 1, name: "obj1", parent: 0},
    {id: 4, name: "obj4", parent: 0},
    {id: 2, name: "obj2", parent: 1},
    {id: 3, name: "obj3", parent: 1},
    {id: 5, name: "obj5", parent: 3},
    {id: 6, name: "obj6", parent: 5},
];

class ObjectsStore {
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

class LinksStore {
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
// TODO: using new store objects

function buildTree(visible: number, objects: ObjectsStore, links: LinksStore): ITreeObject {
    const cacheObjects = new Map<number, IFlatObject>(objects.all.map(o => [o.id, o]));
    const cacheLinks   = new Map<number, ILink>(links.all.map(l => [l.id, l]));

    const raw = cacheObjects.get(visible) || { id: visible, name: "Not Found", parent: null };;
    const build = (o: IFlatObject, current: number): ITreeObject => {
        const node: ITreeObject = { ...o, objects: [], links: [], mass: 1, x: Math.random(), y: Math.random(), size: 100 };
        if (current < 3) {
            const children = Array.from(cacheObjects.values()).filter(i => i.parent === o.id);
            
            if (children.length > 0) {
                node.objects = children.map(child => build(child, current + 1));
                node.mass += node.objects.reduce((sum, child) => sum + child.mass, 0); // updateMass
                const links = new Set(children.map(i => i.id));
                node.links = Array.from(cacheLinks.values()).filter(e => 
                    links.has(e.is) && links.has(e.to)
                );
            }
        }
        return node;
    };
    return build(raw, 0);
}

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

// export const objectsStore = {
//     subscribe: treeStore.subscribe,
    
//     addObject: (newObj: IFlatObject) => {
//         // if (cacheObjects.has(newObj.id)) return;
        
//         newObj.id = flatObjects.length;
//         // cacheObjects.set(newObj.id, newObj);
//         flatObjects.push(newObj);
//         treeStore.set(buildTree(viewStore.view, objects, links));
//     },
// };