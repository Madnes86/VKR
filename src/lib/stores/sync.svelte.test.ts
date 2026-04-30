import { describe, expect, it, vi, beforeEach } from 'vitest';

// Мокаем backend: pushSync ставим как spy.
const pushSyncMock = vi.fn();
vi.mock('$lib/functions/backend', () => ({
	pushSync: pushSyncMock,
	pushSyncBeacon: vi.fn()
}));

// Мокаем i18n и notification, чтобы не тянуть реальные словари.
vi.mock('$lib/stores/notification.svelte', () => ({
	notificationStore: { error: vi.fn(), success: vi.fn() }
}));
vi.mock('$lib/i18n', () => ({
	i18n: { t: (k: string) => k, lang: 'ru', set: vi.fn() }
}));

// Импортируем ПОСЛЕ mock'ов.
const { syncQueue } = await import('./sync.svelte');

// Простая симуляция токена.
beforeEach(() => {
	localStorage.setItem('token', 'fake');
	pushSyncMock.mockReset();
	syncQueue.clear();
});

describe('syncQueue — формат запроса', () => {
	it('Создание + апдейт того же tmp-объекта схлопываются в один create', async () => {
		pushSyncMock.mockResolvedValue({ objects: [], links: [], id_map: {} });

		syncQueue.enqueueObjectCreate(-1, { name: 'A', type: 'default', parent: null });
		syncQueue.enqueueObjectUpdate(-1, { name: 'A2' });
		await syncQueue.flush();

		expect(pushSyncMock).toHaveBeenCalledTimes(1);
		const req = pushSyncMock.mock.calls[0][0];
		expect(req.objects.create).toEqual([
			{ tmp_id: '-1', name: 'A2', type: 'default', parent: null }
		]);
		expect(req.objects.update).toEqual([]);
	});

	it('Удаление несохранённого tmp-объекта отменяет его create полностью', async () => {
		pushSyncMock.mockResolvedValue({ objects: [], links: [], id_map: {} });

		syncQueue.enqueueObjectCreate(-1, { name: 'tmp', type: 'default', parent: null });
		syncQueue.enqueueObjectDelete(-1);
		await syncQueue.flush();

		// Ничего не должно было уйти на сервер
		expect(pushSyncMock).not.toHaveBeenCalled();
	});

	it('Delete реального id выкидывает предыдущие апдейты этого id', async () => {
		pushSyncMock.mockResolvedValue({ objects: [], links: [], id_map: {} });

		syncQueue.enqueueObjectUpdate(5, { name: 'x' });
		syncQueue.enqueueObjectUpdate(5, { name: 'y' });
		syncQueue.enqueueObjectDelete(5);
		await syncQueue.flush();

		const req = pushSyncMock.mock.calls[0][0];
		expect(req.objects.update).toEqual([]);
		expect(req.objects.delete).toEqual([5]);
	});

	it('Group-by-kind: несколько операций разных типов корректно раскладываются', async () => {
		pushSyncMock.mockResolvedValue({ objects: [], links: [], id_map: {} });

		syncQueue.enqueueObjectCreate(-1, { name: 'A', type: 'default', parent: null });
		syncQueue.enqueueObjectUpdate(7, { name: 'new' });
		syncQueue.enqueueObjectDelete(8);
		syncQueue.enqueueLinkCreate(-2, { name: 'l', type: 'default', is: -1, to: 7 });
		syncQueue.enqueueLinkUpdate(9, { isValue: true });
		syncQueue.enqueueLinkDelete(10);
		await syncQueue.flush();

		const req = pushSyncMock.mock.calls[0][0];
		expect(req.objects.create).toHaveLength(1);
		expect(req.objects.update).toEqual([{ id: 7, name: 'new' }]);
		expect(req.objects.delete).toEqual([8]);
		expect(req.links.create).toHaveLength(1);
		// tmp-ссылка на -1 → строка "-1", реальный id 7 → число 7
		expect(req.links.create[0].is).toBe('-1');
		expect(req.links.create[0].to).toBe(7);
		expect(req.links.update).toEqual([{ id: 9, isValue: true }]);
		expect(req.links.delete).toEqual([10]);
	});

	it('Отрицательные parent/is/to сериализуются как строки (tmp-ссылки)', async () => {
		pushSyncMock.mockResolvedValue({ objects: [], links: [], id_map: {} });

		// Создаём родителя A (tmp -1), ребёнка B (tmp -2) с parent=-1, линк между ними.
		syncQueue.enqueueObjectCreate(-1, { name: 'A', type: 'default', parent: null });
		syncQueue.enqueueObjectCreate(-2, { name: 'B', type: 'default', parent: -1 });
		syncQueue.enqueueLinkCreate(-3, { name: 'l', type: 'default', is: -1, to: -2 });
		await syncQueue.flush();

		const req = pushSyncMock.mock.calls[0][0];
		expect(req.objects.create[0].parent).toBeNull();
		expect(req.objects.create[1].parent).toBe('-1'); // tmp ссылка на родителя
		expect(req.links.create[0].is).toBe('-1');
		expect(req.links.create[0].to).toBe('-2');
	});
});

describe('syncQueue — реакция на ответ сервера', () => {
	it('Зовёт onIdMapApplied с id_map', async () => {
		pushSyncMock.mockResolvedValue({
			objects: [],
			links: [],
			id_map: { '-1': 42, '-2': 99 }
		});
		const spy = vi.fn();
		const prev = syncQueue.onIdMapApplied;
		syncQueue.onIdMapApplied = spy;
		try {
			syncQueue.enqueueObjectCreate(-1, { name: 'A', type: 'default', parent: null });
			await syncQueue.flush();
			expect(spy).toHaveBeenCalledWith({ '-1': 42, '-2': 99 });
		} finally {
			syncQueue.onIdMapApplied = prev;
		}
	});

	it('Переписывает tmp-id в ожидающих операциях после id_map', async () => {
		// Первый flush создаёт объект -1 → 42.
		pushSyncMock.mockResolvedValueOnce({
			objects: [],
			links: [],
			id_map: { '-1': 42 }
		});
		syncQueue.enqueueObjectCreate(-1, { name: 'A', type: 'default', parent: null });

		// Пока flush в полёте, пользователь продолжает редактировать
		// (эмулируем тем, что после first flush добавляем update для старого id=-1)
		const firstFlush = syncQueue.flush();
		// добавим update пока flush ещё не завершился — окажется в новой очереди
		syncQueue.enqueueObjectUpdate(-1, { name: 'after-flight' });
		await firstFlush;

		// Второй flush — id_map переписал ожидающий update на реальный id.
		pushSyncMock.mockResolvedValueOnce({ objects: [], links: [], id_map: {} });
		await syncQueue.flush();

		const secondReq = pushSyncMock.mock.calls[1][0];
		expect(secondReq.objects.update).toEqual([{ id: 42, name: 'after-flight' }]);
	});

	it('Сбой сети → ops возвращаются в очередь, pending > 0', async () => {
		pushSyncMock.mockResolvedValueOnce(null); // apiFetch вернул null

		syncQueue.enqueueObjectCreate(-1, { name: 'A', type: 'default', parent: null });
		syncQueue.enqueueObjectUpdate(5, { name: 'edit' });
		await syncQueue.flush();

		expect(syncQueue.pending).toBe(2);
		expect(syncQueue.error).toBe('sync.failed');
	});

	it('Если нет токена — ничего не шлём, очередь сбрасывается', async () => {
		localStorage.removeItem('token');
		syncQueue.enqueueObjectCreate(-1, { name: 'A', type: 'default', parent: null });
		await syncQueue.flush();

		expect(pushSyncMock).not.toHaveBeenCalled();
		expect(syncQueue.pending).toBe(0);
	});
});
