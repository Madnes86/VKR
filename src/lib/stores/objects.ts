import { writable } from 'svelte/store';

export type IFlatObject = {
    id: number,
    name: string, 
    x: number, 
    y: number, 
    size: number, 
    mass: number,
    parent: number | 'root',
};
export type ITreeObject ={
    id: number;
    name: string;
    x: number;
    y: number;
    size: number;
    mass: number;
    parent: number | 'root';
    objects: ITreeObject[];
}

export let flatData: IFlatObject[] = [
    {id: 0, name: "root", x: 100, y: 100, size: 100, mass: 4, parent: 'root'},
    {id: 1, name: "obj1", x: 390, y: 20,  size: 100, mass: 3, parent: 0},
    {id: 4, name: "obj4", x: 390, y: 20,  size: 100, mass: 3, parent: 0},
    {id: 2, name: "obj2", x: 390, y: 300, size: 100, mass: 1, parent: 1},
    {id: 3, name: "obj3", x: 500, y: 500, size: 100, mass: 1, parent: 1},
];

function buildTree(flatObjects: IFlatObject[]): ITreeObject[] {
    const objectMap = new Map();
    const roots: any = [];
    flatObjects.forEach(obj => {
        objectMap.set(obj.id, {
            id: obj.id,
            name: obj.name,
            x: obj.x,
            y: obj.y,
            size: obj.size,
            mass: obj.mass,
            objects: []
        });
    });
    flatObjects.forEach(obj => {
        if (obj.parent !== 'root') {
            const parentObj = objectMap.get(obj.parent as number);
            const currentObj = objectMap.get(obj.id);
            if (parentObj && currentObj) {
                parentObj.objects!.push(currentObj);
            }
        } else {
            roots.push(objectMap.get(obj.id));
        }
    });
    roots.forEach(root => {
        updateMass(root)
    })
    return roots;
}
function updateMass(node) {
    if (node.objects.length === 0) {
        return node.mass;
    }
    const children = node.objects.reduce((sum, child) => {
        return sum + updateMass(child);
    }, 0);
    node.mass = node.mass + children;
    return node.mass;
}

const treeStore = writable<ITreeObject[]>(buildTree(flatData));

export const objectsStore = {
    subscribe: treeStore.subscribe,
    
    addObject: (newObj: IFlatObject) => {
        const exists = flatData.some(obj => obj.id === newObj.id);
        if (exists) {
            return
        }
        flatData = [...flatData, newObj];
        treeStore.set(buildTree(flatData));
    },

    // update: (obj: IFlatObject) => update(objects => objects.map(e => e.name === obj.name ? obj : e)),
    updateSizes: (scale: number, SIZE: number) => {
        flatData= flatData.map(obj => ({
            ...obj,
            size: SIZE * obj.mass * scale
        }));
        treeStore.set(buildTree(flatData));
    },
    // updateSizes: (scale: number, SIZE: number) => {
    //     objects.map(obj => ({
    //         ...obj,
    //         size: SIZE * (obj.mass) * scale
    //     }))
    //     treeStore.set(buildTree(flatData));
    // ),
    
    // updateAll: (newObjects: IFlatObject[]) => set(newObjects),
    
    // removeObject: (name: string) => update(objects => 
    //     objects.filter(obj => obj.name !== name)
    // )
};