import { writable } from 'svelte/store';

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
};
export type IFlatLink = {
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

export let flatLinks: IFlatLink[] = [
    { id: 0, name: "read", is: 1, to: 4, isValue: 1, toValue: 1 }
];

const cacheObjects = new Map<number, IFlatObject>();

flatObjects.forEach(o => cacheObjects.set(o.id, o));

function buildTree(visible: number): ITreeObject {
    const raw = cacheObjects.get(visible) || { id: visible, name: "Not Found", parent: null };;
    const build = (o: IFlatObject, current: number): ITreeObject => {
        const node: ITreeObject = { ...o, objects: [], mass: 1, x: 0, y: 0, size: 100 };
        if (current < 3) {
            const children = Array.from(cacheObjects.values()).filter(i => i.parent === o.id);
            
            if (children.length > 0) {
                node.objects = children.map(child => build(child, current + 1));
                node.mass += node.objects.reduce((sum, child) => sum + child.mass, 0); // updateMass
            }
        }
        return node;
    };
    return build(raw, 0);
}
class SelectedStore {
    selected: number | null = $state(null);
    set(id: number) {
        this.selected = id;
    }
}
export const selectedStore = new SelectedStore();
class ViewStore {
    view: number = $state(0);
    set(id: number) {
        this.view = id;
        // console.log(id);
        const newTree = buildTree(id);
        // console.log(newTree);
        if (newTree) {
            treeStore.set(newTree);
        }
    }
}
export const viewStore = new ViewStore();

const treeStore = writable<ITreeObject>(buildTree(viewStore.view));

export const objectsStore = {
    subscribe: treeStore.subscribe,
    
    addObject: (newObj: IFlatObject) => {
        if (cacheObjects.has(newObj.id)) return;
        
        cacheObjects.set(newObj.id, newObj);
        flatObjects.push(newObj);
        treeStore.set(buildTree(viewStore.view));
    },
};