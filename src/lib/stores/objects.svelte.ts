import { writable } from 'svelte/store';
import { getObjects } from "$lib/functions/backend";

export type IFlatObject = {
    id: number,
    name: string, 
    parent: number | null,
};
export type ITreeObject ={
    id: number;
    name: string;
    x: number;
    y: number;
    size: number;
    mass: number;
    parent: number | null;
    objects: ITreeObject[];
    links: ILink[];
};
export type ILink = {
    id: number;
    name: string;
    is: number;
    to: number;
    isValue: number;
    toValue: number;
};

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
        if (data && data.length > 0) {
            this.#objects = data;
        } else {
            this.#objects = [
                {id: 0, name: "root", parent: null},
                {id: 1, name: "obj1", parent: 0},
                {id: 4, name: "obj4", parent: 0},
                {id: 2, name: "obj2", parent: 1},
                {id: 3, name: "obj3", parent: 1},
                {id: 5, name: "obj5", parent: 3},
                {id: 6, name: "obj6", parent: 5},
            ];
        }
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

async function init() {
    await objects.fetch();
    console.log(objects.all);
}
init();

export let flatLinks: ILink[] = [
    { id: 0, name: "read", is: 1, to: 4, isValue: 1, toValue: 1 },
    { id: 1, name: "write", is: 2, to: 3, isValue: 1, toValue: 1 },
];

const cacheObjects = new Map<number, IFlatObject>();
const cacheLinks = new Map<number, ILink>();

flatObjects.forEach(o => cacheObjects.set(o.id, o));
flatLinks.forEach(l => cacheLinks.set(l.id, l));

function buildTree(visible: number): ITreeObject {
    const raw = cacheObjects.get(visible) || { id: visible, name: "Not Found", parent: null };;
    const build = (o: IFlatObject, current: number): ITreeObject => {
        const node: ITreeObject = { ...o, objects: [], links: [], mass: 1, x: Math.random(), y: Math.random(), size: 100 };
        if (current < 3) {
            const children = Array.from(cacheObjects.values()).filter(i => i.parent === o.id);
            // const links = Array.from(cacheLinks.values()).filter(i => i.is === o.id);
            
            if (children.length > 0) {
                node.objects = children.map(child => build(child, current + 1));
                node.mass += node.objects.reduce((sum, child) => sum + child.mass, 0); // updateMass
                const links = new Set(children.map(i => i.id));
                node.links = Array.from(cacheLinks.values()).filter(e => 
                    links.has(e.is) && links.has(e.to)
                );
                // console.log(node.links);
            }
        }
        return node;
    };
    return build(raw, 0);
}
class LinkStore {
    link: number | null = $state(null);
    set(id: number) {
        this.link = id;
    }
}
export const linkStore = new LinkStore();
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
        // console.log(id);
        const newTree = buildTree(id);
        // console.log(newTree);
        if (newTree) {
            treeStore.set(newTree);
        }
    }
    clear() {
        this.view = 0;
    }
}
export const viewStore = new ViewStore();

const treeStore = writable<ITreeObject>(buildTree(viewStore.view));

export const objectsStore = {
    subscribe: treeStore.subscribe,
    
    addObject: (newObj: IFlatObject) => {
        if (cacheObjects.has(newObj.id)) return;
        
        newObj.id = flatObjects.length;
        cacheObjects.set(newObj.id, newObj);
        flatObjects.push(newObj);
        treeStore.set(buildTree(viewStore.view));
    },
};