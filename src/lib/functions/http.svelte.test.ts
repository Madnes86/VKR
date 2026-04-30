import { describe, expect, it, vi, beforeEach } from 'vitest';
import { apiFetch, _resetThrottle } from './http';
import { notificationStore } from '$lib/stores/notification.svelte';

vi.mock('$lib/stores/notification.svelte', () => ({
	notificationStore: {
		error: vi.fn(),
		success: vi.fn()
	}
}));

describe('apiFetch', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		_resetThrottle();
	});

	it('Возвращает Response при успешном fetch', async () => {
		const mockResponse = new Response('ok', { status: 200 });
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse));

		const res = await apiFetch('/foo');
		expect(res).toBe(mockResponse);
		expect(notificationStore.error).not.toHaveBeenCalled();
	});

	it('Возвращает Response даже при 4xx/5xx — ответственность вызывающего', async () => {
		const mockResponse = new Response('bad', { status: 500 });
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse));

		const res = await apiFetch('/foo');
		expect(res?.status).toBe(500);
		expect(notificationStore.error).not.toHaveBeenCalled();
	});

	it('При сетевом сбое возвращает null и показывает уведомление', async () => {
		vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));

		const res = await apiFetch('/foo');
		expect(res).toBeNull();
		expect(notificationStore.error).toHaveBeenCalledTimes(1);
		expect(notificationStore.error).toHaveBeenCalledWith(
			expect.stringMatching(/недоступен|unreachable/i),
			'error'
		);
	});

	it('Дроссель: серия сбоев подряд показывает одно уведомление', async () => {
		vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));

		await apiFetch('/a');
		await apiFetch('/b');
		await apiFetch('/c');

		expect(notificationStore.error).toHaveBeenCalledTimes(1);
	});

	it('После сброса throttle следующий сбой снова уведомляет', async () => {
		vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));

		await apiFetch('/a');
		_resetThrottle();
		await apiFetch('/b');

		expect(notificationStore.error).toHaveBeenCalledTimes(2);
	});
});
