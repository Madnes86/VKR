import { page } from 'vitest/browser';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render } from 'vitest-browser-svelte';
import GlobalEditor from './GlobalEditor.svelte';
import { objects as initialObjects } from '$lib/mocs/objects';
import { links as initialLinks } from '$lib/mocs/links';
import { selectedStore, viewStore } from '$lib/stores/objects.svelte';
import { searchStore } from '$lib/stores/search.svelte';
import { i18n } from '$lib/i18n';
import { goto } from '$app/navigation';

vi.mock('$app/navigation', () => ({ goto: vi.fn() }));
vi.mock('$lib/stores/notification.svelte', () => ({
    notificationStore: {
        success: vi.fn(),
        error: vi.fn()
    }
}));

const initialText = [
    ...initialObjects.map(o => o.name),
    ...initialLinks.map(l => l.name)
].join(' ');

describe('GlobalEditor', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        i18n.set('en');
        searchStore.set('', []);
        selectedStore.clear('selected');
        selectedStore.clear('hover');
        viewStore.clear();
    });

    function setup() {
        render(GlobalEditor);
        return {
            textarea: page.getByRole('textbox', { name: 'global-editor' }),
            searchInput: page.getByPlaceholder('Search'),
            searchBtn: page.getByRole('button', { name: 'search' }),
            clearBtn: page.getByRole('button', { name: 'cross' }),
            syncBtn: page.getByRole('button', { name: /sync/i })
        };
    }

    it('начальный текст — имена объектов и связей', async () => {
        const { textarea } = setup();
        await expect.element(textarea).toHaveValue(initialText);
    });

    it('начальная статистика содержит счётчики', async () => {
        setup();
        await expect.element(page.getByText('Objects:', { exact: false })).toBeInTheDocument();
        await expect.element(page.getByText('Links:', { exact: false })).toBeInTheDocument();
        await expect.element(page.getByText('Unsynced:', { exact: false })).toBeInTheDocument();
        await expect.element(page.getByText('Chars:', { exact: false })).toBeInTheDocument();
    });

    it('ввод в textarea обновляет значение', async () => {
        const { textarea } = setup();
        await textarea.fill('root obj1 newword');
        await expect.element(textarea).toHaveValue('root obj1 newword');
    });

    it('новое слово отображается как несинхронизированное', async () => {
        const { textarea } = setup();
        await textarea.fill(initialText + ' brandnew');
        await expect.element(page.getByText('brandnew', { exact: true }).first()).toBeInTheDocument();
    });

    it('sync добавляет новое слово в items', async () => {
        const { textarea, syncBtn } = setup();
        await textarea.fill(initialText + ' brandnew');
        await syncBtn.click();
        await expect.element(
            page.getByText(String(initialObjects.length + 1), { exact: true }).first()
        ).toBeInTheDocument();
    });

    it('клик по объекту ставит viewStore и идёт в /app', async () => {
        setup();
        const span = page.getByText('root', { exact: true }).first();
        await span.click();
        expect(viewStore.view).toBe(0);
        expect(selectedStore.selected).toBe('o + 0');
        expect(goto).toHaveBeenCalledWith('/app');
    });

    it('клик по "Поиск" оставляет только совпадения', async () => {
        const { searchInput, searchBtn } = setup();
        await searchInput.fill('obj');
        await searchBtn.click();
        await expect.element(page.getByText('obj1', { exact: true }).first()).toBeInTheDocument();
        await expect.element(page.getByText('obj4', { exact: true }).first()).toBeInTheDocument();
        await expect.element(page.getByText('root', { exact: true })).not.toBeInTheDocument();
        await expect.element(page.getByText('pasha', { exact: true })).not.toBeInTheDocument();
    });

    it('категория Links по умолчанию выключена — поиск по имени связи не находит', async () => {
        const { searchInput, searchBtn } = setup();
        const linkName = initialLinks[0].name;
        await searchInput.fill(linkName);
        await searchBtn.click();
        await expect.element(page.getByText(linkName, { exact: true })).not.toBeInTheDocument();
    });

    it('очистка запроса выключает filter mode', async () => {
        const { searchInput, searchBtn, clearBtn } = setup();
        await searchInput.fill('obj');
        await searchBtn.click();
        await expect.element(page.getByText('root', { exact: true })).not.toBeInTheDocument();
        await clearBtn.click();
        await expect.element(page.getByText('root', { exact: true }).first()).toBeInTheDocument();
    });
});
