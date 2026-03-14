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

const data: IFlatObject[] = [
    {id: 0, name: "root", x: 100, y: 100, size: 100, mass: 4, parent: 'root'},
    {id: 1, name: "obj1", x: 390, y: 20,  size: 100, mass: 3, parent: 0},
    {id: 2, name: "obj2", x: 390, y: 300, size: 100, mass: 1, parent: 1},
    {id: 3, name: "obj3", x: 500, y: 500, size: 100, mass: 1, parent: 1},
];
const { subscribe, update, set } = writable<IFlatObject[]>(buildTree(data));

function buildTree(flatObjects: IFlatObject[]) {
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

export const objectsStore = {
    subscribe,
    set,
    
    addObject: (newObj: IFlatObject) => update(tree => {
        // Создаем узел для нового объекта
        const newNode: ITreeObject = {
            id: newObj.id,
            name: newObj.name,
            x: newObj.x,
            y: newObj.y,
            size: newObj.size,
            mass: newObj.mass,
            parent: newObj.parent,
            objects: []
        };
        
        // Если объект корневой
        if (newObj.parent === 'root') {
            tree.push(newNode);
        } else {
            // Ищем родителя
            const parent = findNodeById(tree, newObj.parent as number);
            if (parent) {
                parent.objects.push(newNode);
                updateMass(parent); // Пересчитываем массу родителя
            }
        }
        
        return tree;
    }),

    update: (obj: IFlatObject) => update(objects => objects.map(e => e.name === obj.name ? obj : e)),
    
    updateSizes: (scale: number, SIZE: number) => update(objects => 
        objects.map(obj => ({
            ...obj,
            size: SIZE * (obj.mass) * scale
        }))
    ),
    
    updateAll: (newObjects: IFlatObject[]) => set(newObjects),
    
    removeObject: (name: string) => update(objects => 
        objects.filter(obj => obj.name !== name)
    )
};