import { writable } from 'svelte/store';

export type ObjectType = {
    name: string, 
    x: number, 
    y: number, 
    size: number, 
    mass: number
};

const { subscribe, update, set } = writable<ObjectType[]>([
    {name: "obj1", x: 300, y: 0, size: 100, mass: 2},
    {name: "obj2", x: 0, y: 0, size: 100, mass: 4},
    {name: "obj3", x: 0, y: 0, size: 100, mass: 9},
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