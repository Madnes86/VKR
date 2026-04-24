import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import Modal from './Modal.svelte';
import { modalStore } from '$lib/stores/modal.svelte';

vi.mock('$lib/functions/auth', () => ({
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    updateMe: vi.fn(),
    startOAuth: vi.fn(),
    fetchProviders: vi.fn(async () => ({ google: true, yandex: true })),
}));

// exact: true — иначе partial match захватывает и внешнюю backdrop-кнопку,
// чей accessible name включает alt вложенных картинок.
const googleBtn = () => page.getByRole('button', { name: 'Google', exact: true });
const yandexBtn = () => page.getByRole('button', { name: 'Yandex', exact: true });

describe('Modal — OAuth buttons (enabled)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        modalStore.reset();
    });
    afterEach(() => modalStore.reset());

    it('Google-кнопка скруглена и клиппит содержимое', async () => {
        render(Modal);
        modalStore.open('login');

        await expect.element(googleBtn()).toBeVisible();
        await expect.element(googleBtn()).toHaveClass(/rounded-full/);
        await expect.element(googleBtn()).toHaveClass(/overflow-hidden/);
    });

    it('Yandex-кнопка скруглена и клиппит содержимое', async () => {
        render(Modal);
        modalStore.open('login');

        await expect.element(yandexBtn()).toBeVisible();
        await expect.element(yandexBtn()).toHaveClass(/rounded-full/);
        await expect.element(yandexBtn()).toHaveClass(/overflow-hidden/);
    });

    it('У картинок осмысленный alt', async () => {
        render(Modal);
        modalStore.open('login');

        await expect.element(page.getByAltText('Google')).toBeVisible();
        await expect.element(page.getByAltText('Yandex')).toBeVisible();
    });

    it('Клик по Google вызывает startOAuth("google")', async () => {
        const { startOAuth } = await import('$lib/functions/auth');
        render(Modal);
        modalStore.open('login');

        await googleBtn().click();
        expect(startOAuth).toHaveBeenCalledWith('google');
    });

    it('Клик по Yandex вызывает startOAuth("yandex")', async () => {
        const { startOAuth } = await import('$lib/functions/auth');
        render(Modal);
        modalStore.open('login');

        // Кнопка очень маленькая (size-5), плюс внутри вложенного <button>
        // — Playwright-клик иногда не регистрируется. Идём напрямую через DOM.
        await expect.element(yandexBtn()).toBeVisible();
        const el = yandexBtn().element() as HTMLButtonElement;
        el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
        expect(startOAuth).toHaveBeenCalledWith('yandex');
    });

    it('OAuth-кнопки показываются и в модалке регистрации', async () => {
        render(Modal);
        modalStore.open('registration');

        await expect.element(googleBtn()).toBeVisible();
        await expect.element(yandexBtn()).toBeVisible();
    });
});

describe('Modal — OAuth buttons (disabled)', () => {
    beforeEach(async () => {
        modalStore.reset();
        const mod = await import('$lib/functions/auth');
        vi.mocked(mod.fetchProviders).mockResolvedValue({ google: false, yandex: false });
    });
    afterEach(async () => {
        modalStore.reset();
        const mod = await import('$lib/functions/auth');
        vi.mocked(mod.fetchProviders).mockResolvedValue({ google: true, yandex: true });
    });

    it('Кнопок нет, когда провайдеры выключены на бэке', async () => {
        render(Modal);
        modalStore.open('login');

        await expect.element(page.getByRole('heading', { name: 'Email', exact: true })).toBeVisible();

        expect(googleBtn().elements()).toHaveLength(0);
        expect(yandexBtn().elements()).toHaveLength(0);
    });
});
