import { notificationStore } from "$lib/stores/notification.svelte";
import { modalStore } from "$lib/stores/modal.svelte";
import { userStore, type AuthUser } from "$lib/stores/user.svelte";
import { objects as objectsStore, links as linksStore } from "$lib/stores/objects.svelte";
import { i18n } from "$lib/i18n";
import { apiFetch } from "$lib/functions/http";

// TODO: вынести в env (VITE_API_URL)
const BASE_URL: string = 'http://127.0.0.1:8000';

export type OAuthProvider = 'google' | 'yandex';

export function startOAuth(provider: OAuthProvider): void {
    window.location.href = `${BASE_URL}/auth/${provider}/start`;
}

export async function fetchProviders(): Promise<Record<OAuthProvider, boolean>> {
    const res = await apiFetch(`${BASE_URL}/auth/providers`);
    if (res?.ok) return await res.json();
    return { google: false, yandex: false };
}

export async function fetchMe(token: string): Promise<AuthUser | null> {
    const res = await apiFetch(`${BASE_URL}/users/me`, {
        headers: { 'Authorization': `Bearer ${token}` },
    });
    if (res?.ok) return await res.json();
    return null;
}

type AuthResponse = { access_token: string; token_type: string; user: AuthUser };

function extractError(body: unknown, fallback: string): string {
    if (body && typeof body === 'object' && 'detail' in body) {
        const d = (body as { detail: unknown }).detail;
        if (typeof d === 'string') return d;
        if (Array.isArray(d) && d.length > 0) {
            const first = d[0];
            if (first && typeof first === 'object' && 'msg' in first) {
                return String((first as { msg: unknown }).msg);
            }
        }
    }
    return fallback;
}

async function readJson(res: Response): Promise<unknown> {
    try { return await res.json(); } catch { return null; }
}

export async function login(email: string, password: string): Promise<boolean> {
    const res = await apiFetch(`${BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
    });
    if (!res) return false;  // сервер недоступен, уведомление уже показано

    const body = await readJson(res);
    if (res.ok && body && typeof body === 'object' && 'access_token' in body) {
        const data = body as AuthResponse;
        userStore.setAuth(data.user, data.access_token);
        notificationStore.success(i18n.t('auth.loginSuccess'), 'check');
        modalStore.close();
        return true;
    }
    notificationStore.error(extractError(body, i18n.t('auth.loginFailed')), 'error');
    return false;
}

export async function register(name: string, email: string, password: string): Promise<boolean> {
    const res = await apiFetch(`${BASE_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
    });
    if (!res) return false;

    const body = await readJson(res);
    if (res.ok && body && typeof body === 'object' && 'access_token' in body) {
        const data = body as AuthResponse;
        userStore.setAuth(data.user, data.access_token);
        notificationStore.success(i18n.t('auth.registerSuccess'), 'check');
        modalStore.close();
        return true;
    }
    notificationStore.error(extractError(body, i18n.t('auth.registerFailed')), 'error');
    return false;
}

export function logout(): void {
    userStore.clearAuth();
    objectsStore.clear();
    linksStore.setAll([]);
    modalStore.close();
    notificationStore.success(i18n.t('auth.logoutSuccess'), 'check');
}

export async function requestPasswordReset(email: string): Promise<boolean> {
    const res = await apiFetch(`${BASE_URL}/password/reset/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
    });
    if (!res) return false;
    if (res.ok) {
        notificationStore.success(i18n.t('auth.resetEmailSent'), 'check');
        return true;
    }
    const body = await readJson(res);
    notificationStore.error(extractError(body, i18n.t('auth.resetRequestFailed')), 'error');
    return false;
}

export async function confirmPasswordReset(token: string, password: string): Promise<boolean> {
    const res = await apiFetch(`${BASE_URL}/password/reset/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
    });
    if (!res) return false;
    const body = await readJson(res);
    if (res.ok) {
        notificationStore.success(i18n.t('auth.resetConfirmed'), 'check');
        return true;
    }
    notificationStore.error(extractError(body, i18n.t('auth.resetConfirmFailed')), 'error');
    return false;
}

export async function updateMe(data: Partial<{ name: string; email: string; password: string; current_password: string }>): Promise<boolean> {
    const token = localStorage.getItem('token');
    if (!token) {
        notificationStore.error(i18n.t('auth.noToken'), 'error');
        return false;
    }
    const res = await apiFetch(`${BASE_URL}/users/me`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
    });
    if (!res) return false;

    const body = await readJson(res);
    if (res.ok && body && typeof body === 'object') {
        userStore.updateProfile(body as AuthUser);
        notificationStore.success(i18n.t('auth.profileUpdated'), 'check');
        return true;
    }
    if (res.status === 401) {
        // Токен истёк или невалиден — вычищаем и просим войти заново.
        logout();
        modalStore.open('login');
    }
    notificationStore.error(extractError(body, i18n.t('auth.updateFailed')), 'error');
    return false;
}
