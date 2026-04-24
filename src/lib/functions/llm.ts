import { notificationStore } from "$lib/stores/notification.svelte";
import { objects as objectsStore, links as linksStore } from "$lib/stores/objects.svelte";
import type { IFlatObject, IFlatLink } from "$lib/interface";
import { apiFetch } from "$lib/functions/http";

const LLM_URL: string = 'http://127.0.0.1:8001';

export type ExtractResult = {
    objects: IFlatObject[];
    links: IFlatLink[];
    _meta?: { lang: string; model: string; sentences: number };
};

export async function extractDiagram(
    text: string,
    paragraphIdx?: number
): Promise<ExtractResult | null> {
    if (!text.trim()) return null;

    const token = localStorage.getItem('token');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await apiFetch(`${LLM_URL}/extract`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ text, paragraph_idx: paragraphIdx ?? null })
    });
    if (!res) return null;  // сервис недоступен — уведомление уже показано

    if (res.ok) return await res.json();

    const err = await res.json().catch(() => ({ detail: `HTTP ${res.status}` }));
    notificationStore.error(err.detail ?? 'extract failed', 'error');
    return null;
}

export async function extractAndLoad(text: string, paragraphIdx?: number): Promise<boolean> {
    const result = await extractDiagram(text, paragraphIdx);
    if (!result) return false;
    objectsStore.setAll(result.objects);
    linksStore.setAll(result.links);
    return true;
}

export async function llmHealth(): Promise<boolean> {
    const res = await apiFetch(`${LLM_URL}/health`);
    return res?.ok ?? false;
}
