import type { IFlatObject, IFlatLink } from "$lib/interface";

// TODO: add more methomds 
const BASE_URL: string = 'http://127.0.0.1:8000';

export async function getObjects(): Promise<IFlatObject[]> {
    const token = localStorage.getItem('token');

    try {
        const response = await fetch(`${BASE_URL}/objects`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
    
        if (response.ok) return await response.json();
    } catch (err) {
        console.error("Ошибка получения данных");
    }
    
    return [
        {id: 0, name: "root", type: 'default', parent: null},
        {id: 1, name: "obj1", type: 'default', parent: 0},
        {id: 4, name: "obj4", type: 'default', parent: 0},
        {id: 2, name: "pasha", type: 'interface', parent: 1},
        {id: 3, name: "vadim", type: 'default', parent: 1},
        {id: 5, name: "searchOptional", type: 'optional', parent: 3},
        {id: 6, name: "searchDefault", type: 'default', parent: 5},
    ];
}
export async function getLinks(): Promise<IFlatLink[]> {
    const token = localStorage.getItem('token');

    try {
        const response = await fetch(`${BASE_URL}/links`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
    
        if (response.ok) return await response.json();
    } catch(err) {
        console.error("Ошибка получения данных");
    };
    return [
            { id: 0, name: "read", type: 'optional', is: 1, to: 4, isValue: 1, toValue: 1 },
            { id: 1, name: "write", type: 'default', is: 2, to: 3, isValue: 1, toValue: 1 },
    ];
}
