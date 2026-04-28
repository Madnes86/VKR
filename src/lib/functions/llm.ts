import { notificationStore } from "$lib/stores/notification.svelte";
import { apiFetch } from "$lib/functions/http";
import type { IFlatObject, IFlatLink } from "$lib/interface";

// Бэк проксирует в VKR-LLM, применяет дневные квоты.
const BACKEND_URL: string = 'http://127.0.0.1:8000';

export type LlmHealth = {
    upstream_ok: boolean;
    daily_limit: number;
    used_today: number;
    authenticated: boolean;
};

export async function llmHealth(): Promise<LlmHealth | null> {
    const token = localStorage.getItem('token');
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await apiFetch(`${BACKEND_URL}/llm/health`, { headers });
    if (!res || !res.ok) return null;
    return await res.json();
}

export type SyntaxResult = {
    objects: IFlatObject[];
    links: IFlatLink[];
    _quota?: { used: number; limit: number };
};

export type ExtractMode = 'fast' | 'semantic';

/**
 * Синтаксический разбор: spacy сразу возвращает граф объектов в формате
 * фронта. mode='fast' — только синтаксический парент-ранкер (~1с,
 * default). mode='semantic' — добавляет голос локального LLM (Ollama),
 * 5–30с в зависимости от длины текста и cold-start модели; точнее
 * восстанавливает иерархию на длинных текстах.
 */
export async function extractSyntax(
    text: string,
    mode: ExtractMode = 'fast',
): Promise<SyntaxResult | null> {
    if (!text.trim()) return null;

    const token = localStorage.getItem('token');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await apiFetch(`${BACKEND_URL}/llm/extract-syntax`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ text, mode }),
    });
    if (!res) return null;
    if (res.ok) return await res.json();

    const err = await res.json().catch(() => ({ detail: `HTTP ${res.status}` }));
    notificationStore.error(err.detail ?? 'extract-syntax failed', 'error');
    return null;
}
