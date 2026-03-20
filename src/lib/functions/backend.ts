import { type IFlatObject } from "$lib/stores/objects.svelte";


const BASE_URL: string = 'http://127.0.0.1:8000';

export async function getObjects(): Promise<IFlatObject[]> {
    const token = localStorage.getItem('token');
    
    const response = await fetch(`${BASE_URL}/objects`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (response.ok) {
        return await response.json();
    } else {
        console.error("Ошибка получения данных");
        return [];
    }
}
