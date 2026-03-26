import type { IFlatObject } from "$lib/interface";

export const objects: IFlatObject[] = [
        {id: 0, name: "root", type: 'default', parent: null},
        {id: 1, name: "obj1", type: 'default', parent: 0},
        {id: 4, name: "obj4", type: 'default', parent: 0},
        {id: 2, name: "pasha", type: 'interface', parent: 1},
        {id: 3, name: "vadim", type: 'default', parent: 1},
        {id: 5, name: "searchOptional", type: 'optional', parent: 3},
        {id: 6, name: "searchDefault", type: 'default', parent: 5},
]