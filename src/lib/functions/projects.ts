/**
 * API-клиент для /projects: CRUD + optimistic locking по base_version.
 */

import { apiFetch } from '$lib/functions/http';
import { notificationStore } from '$lib/stores/notification.svelte';

const BASE_URL: string = 'http://127.0.0.1:8000';

export type ProjectSummary = {
	id: number;
	name: string;
	version: number;
	created_at: string;
	updated_at: string;
};

export type Project = ProjectSummary & { code: string };

function authHeaders(): Record<string, string> {
	const token = localStorage.getItem('token');
	return token ? { Authorization: `Bearer ${token}` } : {};
}

function extractDetail(body: unknown, fallback: string): string {
	if (typeof body === 'object' && body !== null && 'detail' in body) {
		const d = (body as { detail: unknown }).detail;
		if (typeof d === 'string') return d;
		if (typeof d === 'object' && d !== null && 'error' in d) {
			return String((d as { error: string }).error);
		}
	}
	return fallback;
}

export async function listProjects(): Promise<ProjectSummary[]> {
	const res = await apiFetch(`${BASE_URL}/projects`, { headers: authHeaders() });
	if (!res) return [];
	if (res.ok) return await res.json();
	notificationStore.error('Failed to load projects', 'error');
	return [];
}

export async function getProject(id: number): Promise<Project | null> {
	const res = await apiFetch(`${BASE_URL}/projects/${id}`, { headers: authHeaders() });
	if (!res) return null;
	if (res.ok) return await res.json();
	notificationStore.error('Project not found', 'error');
	return null;
}

export async function createProject(name: string, code = ''): Promise<Project | null> {
	const res = await apiFetch(`${BASE_URL}/projects`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', ...authHeaders() },
		body: JSON.stringify({ name, code })
	});
	if (!res) return null;
	if (res.ok) return await res.json();
	const body = await res.json().catch(() => ({}));
	notificationStore.error(extractDetail(body, 'Failed to create project'), 'error');
	return null;
}

export type SaveOutcome =
	| { ok: true; project: Project }
	| { ok: false; conflict: true; currentVersion: number }
	| { ok: false; conflict: false; message: string };

export async function saveProject(
	id: number,
	baseVersion: number,
	patch: { name?: string; code?: string }
): Promise<SaveOutcome> {
	const res = await apiFetch(`${BASE_URL}/projects/${id}`, {
		method: 'PUT',
		headers: { 'Content-Type': 'application/json', ...authHeaders() },
		body: JSON.stringify({ ...patch, base_version: baseVersion })
	});
	if (!res) return { ok: false, conflict: false, message: 'network error' };
	if (res.ok) return { ok: true, project: await res.json() };
	if (res.status === 409) {
		const body = await res.json().catch(() => ({}));
		const current = (body?.detail?.current_version as number | undefined) ?? 0;
		return { ok: false, conflict: true, currentVersion: current };
	}
	const body = await res.json().catch(() => ({}));
	return { ok: false, conflict: false, message: extractDetail(body, `HTTP ${res.status}`) };
}

export async function deleteProject(id: number): Promise<boolean> {
	const res = await apiFetch(`${BASE_URL}/projects/${id}`, {
		method: 'DELETE',
		headers: authHeaders()
	});
	return !!res && (res.status === 204 || res.ok);
}
