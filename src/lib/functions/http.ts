import { notificationStore } from '$lib/stores/notification.svelte';
import { i18n } from '$lib/i18n';

const THROTTLE_MS = 5000;
let lastWarnedAt = 0;

function warnServerDown() {
	const now = Date.now();
	if (now - lastWarnedAt < THROTTLE_MS) return;
	lastWarnedAt = now;
	notificationStore.error(i18n.t('network.serverUnreachable'), 'error');
}

/**
 * Обёртка над fetch. На сетевом сбое (сервер не поднят / упал / DNS / CORS-rejection)
 * fetch бросает TypeError — мы его ловим, показываем throttled-уведомление и
 * возвращаем null. HTTP-статусы (4xx/5xx) не трогаем: Response возвращается как есть,
 * вызывающий сам решит, что с ним делать.
 */
export async function apiFetch(
	input: RequestInfo | URL,
	init?: RequestInit
): Promise<Response | null> {
	try {
		// ngrok-free показывает страницу-предупреждение для браузерных запросов;
		// этот заголовок её пропускает. Для обычного бэка безвреден (CORS allow *).
		const headers = new Headers(init?.headers);
		if (!headers.has('ngrok-skip-browser-warning')) {
			headers.set('ngrok-skip-browser-warning', 'true');
		}
		return await fetch(input, { ...init, headers });
	} catch (err) {
		console.error('[apiFetch] network failure:', err);
		warnServerDown();
		return null;
	}
}

/** Сбрасывает throttle. Для тестов. */
export function _resetThrottle() {
	lastWarnedAt = 0;
}
