import { objects } from "$lib/mocs/objects";
import { links } from "$lib/mocs/links";
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
    
    return objects;
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
    return links;
}
