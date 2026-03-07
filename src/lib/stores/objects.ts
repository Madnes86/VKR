import { writable } from 'svelte/store';

export type ObjectType = {
    id: number,
    name: string, 
    x: number, 
    y: number, 
    size: number, 
    mass: number
};

const { subscribe, update, set } = writable<ObjectType[]>([
    {id: 1, name: "obj1", x: 390, y: 20, size: 100, mass: 2},
    {id: 2, name: "obj2", x: 390,   y: 300, size: 100, mass: 4},
    {id: 3, name: "obj3", x: 500,   y: 500, size: 100, mass: 9},
]);


export const objectsStore = {
    subscribe,
    set,
    
    addObject: (obj: ObjectType) => update(objects => [...objects, obj]),

    update: (obj: ObjectType) => update(objects => objects.map(e => e.name === obj.name ? obj : e)),
    
    updateSizes: (scale: number, SIZE: number) => update(objects => 
        objects.map(obj => ({
            ...obj,
            size: SIZE * (obj.mass * 0.1) * scale
        }))
    ),
    
    updateAll: (newObjects: ObjectType[]) => set(newObjects),
    
    removeObject: (name: string) => update(objects => 
        objects.filter(obj => obj.name !== name)
    )
};