import {
    pushSync,
    pushSyncBeacon,
    type SyncRequest,
    type ObjectCreateDiff,
    type ObjectUpdateDiff,
    type LinkCreateDiff,
    type LinkUpdateDiff,
} from "$lib/functions/backend";
import { notificationStore } from "$lib/stores/notification.svelte";
import { i18n } from "$lib/i18n";

type ObjCreate = { kind: 'obj_create'; tmpId: number; data: Omit<ObjectCreateDiff, 'tmp_id'> };
type ObjUpdate = { kind: 'obj_update'; id: number; data: Omit<ObjectUpdateDiff, 'id'> };
type ObjDelete = { kind: 'obj_delete'; id: number };
type LnkCreate = { kind: 'link_create'; tmpId: number; data: Omit<LinkCreateDiff, 'tmp_id'> };
type LnkUpdate = { kind: 'link_update'; id: number; data: Omit<LinkUpdateDiff, 'id'> };
type LnkDelete = { kind: 'link_delete'; id: number };

export type PendingOp = ObjCreate | ObjUpdate | ObjDelete | LnkCreate | LnkUpdate | LnkDelete;

const DEBOUNCE_MS = 800;

class SyncQueue {
    #queue: PendingOp[] = [];
    #timer: ReturnType<typeof setTimeout> | null = null;
    #flushing = $state(false);
    #pending = $state(0);
    #error = $state<string | null>(null);

    /** Callback вызывается после того, как сервер вернул id_map — стор делает замены. */
    onIdMapApplied: ((idMap: Record<string, number>) => void) | null = null;

    get flushing() { return this.#flushing }
    get pending() { return this.#pending }
    get error() { return this.#error }

    // ---------- enqueue ----------

    enqueueObjectCreate(tmpId: number, data: Omit<ObjectCreateDiff, 'tmp_id'>) {
        this.#queue.push({ kind: 'obj_create', tmpId, data });
        this.#schedule();
    }

    enqueueObjectUpdate(id: number, data: Omit<ObjectUpdateDiff, 'id'>) {
        // Если объект ещё не создан (tmp id отрицательный) — мержим патч в его create.
        if (id < 0) {
            const create = this.#findCreate('obj_create', id);
            if (create) {
                create.data = { ...create.data, ...data };
                this.#schedule();
                return;
            }
        }
        this.#queue.push({ kind: 'obj_update', id, data });
        this.#schedule();
    }

    enqueueObjectDelete(id: number) {
        if (id < 0) {
            // Удаление несохранённого объекта — просто выкидываем все его ожидания.
            this.#queue = this.#queue.filter(op => {
                if (op.kind === 'obj_create' && op.tmpId === id) return false;
                if (op.kind === 'obj_update' && op.id === id) return false;
                return true;
            });
            this.#schedule();
            return;
        }
        // Для реального id: убираем предыдущие апдейты (они бессмысленны) и ставим delete.
        this.#queue = this.#queue.filter(op => !(op.kind === 'obj_update' && op.id === id));
        this.#queue.push({ kind: 'obj_delete', id });
        this.#schedule();
    }

    enqueueLinkCreate(tmpId: number, data: Omit<LinkCreateDiff, 'tmp_id'>) {
        this.#queue.push({ kind: 'link_create', tmpId, data });
        this.#schedule();
    }

    enqueueLinkUpdate(id: number, data: Omit<LinkUpdateDiff, 'id'>) {
        if (id < 0) {
            const create = this.#findCreate('link_create', id);
            if (create) {
                create.data = { ...create.data, ...data };
                this.#schedule();
                return;
            }
        }
        this.#queue.push({ kind: 'link_update', id, data });
        this.#schedule();
    }

    enqueueLinkDelete(id: number) {
        if (id < 0) {
            this.#queue = this.#queue.filter(op => {
                if (op.kind === 'link_create' && op.tmpId === id) return false;
                if (op.kind === 'link_update' && op.id === id) return false;
                return true;
            });
            this.#schedule();
            return;
        }
        this.#queue = this.#queue.filter(op => !(op.kind === 'link_update' && op.id === id));
        this.#queue.push({ kind: 'link_delete', id });
        this.#schedule();
    }

    // ---------- flush ----------

    #schedule() {
        this.#pending = this.#queue.length;
        if (this.#timer) clearTimeout(this.#timer);
        this.#timer = setTimeout(() => this.flush(), DEBOUNCE_MS);
    }

    async flush(): Promise<void> {
        if (this.#timer) { clearTimeout(this.#timer); this.#timer = null; }
        if (this.#flushing) return;
        if (this.#queue.length === 0) return;

        if (!localStorage.getItem('token')) {
            // без авторизации — sync не отправляем, но и очередь не копим
            this.#queue = [];
            this.#pending = 0;
            return;
        }

        const batch = this.#queue;
        this.#queue = [];
        this.#pending = 0;
        this.#flushing = true;

        try {
            const req = buildRequest(batch);
            const resp = await pushSync(req);
            if (!resp) {
                // сервер недоступен — возвращаем ops в очередь
                this.#queue = [...batch, ...this.#queue];
                this.#pending = this.#queue.length;
                this.#error = i18n.t('sync.failed');
                return;
            }
            this.#error = null;
            if (resp.id_map && Object.keys(resp.id_map).length > 0) {
                this.#remapQueue(resp.id_map);
                this.onIdMapApplied?.(resp.id_map);
            }
        } catch (e) {
            console.error('[sync] flush error', e);
            this.#queue = [...batch, ...this.#queue];
            this.#pending = this.#queue.length;
            this.#error = i18n.t('sync.failed');
            notificationStore.error(i18n.t('sync.failed'), 'error');
        } finally {
            this.#flushing = false;
        }

        if (this.#queue.length > 0) this.#schedule();
    }

    /** Немедленно отправить остатки очереди через keepalive (при закрытии вкладки). */
    flushBeacon(): void {
        if (this.#queue.length === 0) return;
        if (!localStorage.getItem('token')) return;
        const req = buildRequest(this.#queue);
        pushSyncBeacon(req);
        this.#queue = [];
        this.#pending = 0;
    }

    clear(): void {
        if (this.#timer) clearTimeout(this.#timer);
        this.#timer = null;
        this.#queue = [];
        this.#pending = 0;
        this.#error = null;
    }

    // ---------- helpers ----------

    #findCreate(kind: 'obj_create', tmpId: number): ObjCreate | null;
    #findCreate(kind: 'link_create', tmpId: number): LnkCreate | null;
    #findCreate(kind: 'obj_create' | 'link_create', tmpId: number): ObjCreate | LnkCreate | null {
        for (const op of this.#queue) {
            if (op.kind === kind && op.tmpId === tmpId) {
                return op as ObjCreate | LnkCreate;
            }
        }
        return null;
    }

    /** После успешного ответа сервера: переписать tmp-id в ожидающих операциях. */
    #remapQueue(idMap: Record<string, number>) {
        for (const op of this.#queue) {
            if (op.kind === 'obj_update' || op.kind === 'obj_delete') {
                if (op.id < 0 && String(op.id) in idMap) op.id = idMap[String(op.id)];
            }
            if (op.kind === 'obj_update' && typeof op.data.parent === 'number' && op.data.parent < 0) {
                const real = idMap[String(op.data.parent)];
                if (real !== undefined) op.data.parent = real;
            }
            if (op.kind === 'link_update' || op.kind === 'link_delete') {
                if (op.id < 0 && String(op.id) in idMap) op.id = idMap[String(op.id)];
            }
        }
    }
}

/**
 * Сериализует ссылку на объект для батча. Отрицательные (tmp) id улетают строкой,
 * положительные (реальные) — числом. Бэк по типу отличает tmp-ref от real-id.
 */
function refOut(id: number | null | undefined): number | string | null {
    if (id === null || id === undefined) return null;
    return id < 0 ? String(id) : id;
}

function buildRequest(ops: PendingOp[]): SyncRequest {
    const req: SyncRequest = {
        objects: { create: [], update: [], delete: [] },
        links: { create: [], update: [], delete: [] },
    };
    for (const op of ops) {
        switch (op.kind) {
            case 'obj_create': {
                const { parent, ...rest } = op.data;
                req.objects.create.push({
                    tmp_id: String(op.tmpId),
                    ...rest,
                    parent: refOut(parent as number | null | undefined),
                });
                break;
            }
            case 'obj_update':
                req.objects.update.push({ id: op.id, ...op.data });
                break;
            case 'obj_delete':
                req.objects.delete.push(op.id);
                break;
            case 'link_create': {
                const { is, to, ...rest } = op.data;
                req.links.create.push({
                    tmp_id: String(op.tmpId),
                    ...rest,
                    is: refOut(is as number | null | undefined) as number | string,
                    to: refOut(to as number | null | undefined) as number | string,
                });
                break;
            }
            case 'link_update':
                req.links.update.push({ id: op.id, ...op.data });
                break;
            case 'link_delete':
                req.links.delete.push(op.id);
                break;
        }
    }
    return req;
}

export const syncQueue = new SyncQueue();

// Flush при закрытии вкладки — fetch keepalive не даст данным потеряться.
if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => syncQueue.flushBeacon());
}
