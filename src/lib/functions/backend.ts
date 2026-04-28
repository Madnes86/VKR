import { objects } from "$lib/mocs/objects";
import { links } from "$lib/mocs/links";
import type { IFlatObject, IFlatLink } from "$lib/interface";
import { apiFetch } from "$lib/functions/http";

const BASE_URL: string = 'http://127.0.0.1:8000';

function authHeaders(): Record<string, string> {
    const token = localStorage.getItem('token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
}

export async function getObjects(): Promise<IFlatObject[]> {
    const res = await apiFetch(`${BASE_URL}/objects`, { headers: authHeaders() });
    if (res?.ok) return await res.json();
    return objects;
}

export async function getLinks(): Promise<IFlatLink[]> {
    const res = await apiFetch(`${BASE_URL}/links`, { headers: authHeaders() });
    if (res?.ok) return await res.json();
    return links;
}

export type State = { objects: IFlatObject[]; links: IFlatLink[] };

export async function fetchState(): Promise<State | null> {
    const res = await apiFetch(`${BASE_URL}/state`, { headers: authHeaders() });
    if (res?.ok) return await res.json();
    return null;
}

// ---- sync ----

export type ObjectCreateDiff = {
    tmp_id: string;
    name: string;
    type?: string;
    parent?: number | string | null;
    content?: Record<string, unknown> | null;
};
export type ObjectUpdateDiff = {
    id: number;
    name?: string;
    type?: string;
    parent?: number | null;
    content?: Record<string, unknown> | null;
};
export type LinkCreateDiff = {
    tmp_id: string;
    name: string;
    type?: string;
    is: number | string;
    to: number | string;
    isValue?: boolean;
    toValue?: boolean;
};
export type LinkUpdateDiff = {
    id: number;
    name?: string;
    type?: string;
    is?: number;
    to?: number;
    isValue?: boolean;
    toValue?: boolean;
};

export type SyncRequest = {
    objects: {
        create: ObjectCreateDiff[];
        update: ObjectUpdateDiff[];
        delete: number[];
    };
    links: {
        create: LinkCreateDiff[];
        update: LinkUpdateDiff[];
        delete: number[];
    };
};

export type SyncResponse = {
    objects: IFlatObject[];
    links: IFlatLink[];
    id_map: Record<string, number>;
};

export async function pushSync(diff: SyncRequest): Promise<SyncResponse | null> {
    const res = await apiFetch(`${BASE_URL}/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(diff),
    });
    if (res?.ok) return await res.json();
    return null;
}

/**
 * Flush через Fetch API `keepalive` — запрос переживает unload страницы.
 * Используется при закрытии вкладки, чтобы не терять правки.
 */
export function pushSyncBeacon(diff: SyncRequest): void {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
        fetch(`${BASE_URL}/sync`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(diff),
            keepalive: true,
        }).catch(() => {});
    } catch {}
}
