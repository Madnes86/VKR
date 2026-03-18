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
    {id: 6, name: "obj6", parent: 4},
];

export let flatLinks: IFlatLink[] = [
    { id: 0, name: "read", is: 1, to: 4, isValue: 1, toValue: 1 }
];

const cacheObjects = new Map<number, IFlatObject>();
const visible = 0;

flatObjects.forEach(o => cacheObjects.set(o.id, o));

function buildTree(visible: number): ITreeObject | null {
    const raw = cacheObjects.get(visible);
    if (!raw) return null;
    const build = (o: IFlatObject, current: number): ITreeObject => {
        const node: ITreeObject = { ...o, objects: [], mass: 1, x: 0, y: 0, size: 100 };
        if (current < 3) {
            const children = Array.from(cacheObjects.values()).filter(i => i.parent === o.id);
            node.objects = children.map(child => build(child, current +1));
        }
        return node;
    };
    return build(raw, 0);
}
function updateMass(node: ITreeObject): number {
    node.mass = 1;

    if (node.objects.length === 0) {
        return node.mass;
    }
    const children = node.objects.reduce((sum, child) => {
        return sum + updateMass(child);
    }, 0);
    node.mass = node.mass + children;
    return node.mass;
}
let tree = (buildTree(visible));
if (tree) {
    updateMass(tree);
}

const treeStore = writable<ITreeObject>(tree);

export const objectsStore = {
    subscribe: treeStore.subscribe,
    
    // Обновляем кэш при добавлении
    addObject: (newObj: IFlatObject) => {
        if (cacheObjects.has(newObj.id)) return;
        
        cacheObjects.set(newObj.id, newObj); // Сначала в кэш!
        flatObjects.push(newObj); 
        
        const tree = buildTree(visible);
        if (tree) {
            updateMass(tree);
            treeStore.set(tree);
        }
    },
};