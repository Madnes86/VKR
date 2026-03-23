import { page } from 'vitest/browser';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Search from './Search.svelte';
import { searchStore } from '$lib/stores/search.svelte';


vi.mock('$lib/stores/search.svelte', () => ({
    searchStore: {
        set: vi.fn()
    }
}));

describe('Search component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('inputing', async () => {
        render(Search);
        const input = page.getByPlaceholder('Search');
        await input.fill('Svelte 5');
        await expect.element(input).toHaveValue('Svelte 5');
    });
    it('search', async () => {
        render(Search);
        const input = page.getByPlaceholder('Search');
        const buttonSearch = page.getByRole('button', { name: 'search'});
    
        await input.fill(' ');
        await expect.element(input).toHaveValue(' ');
        await buttonSearch.click();
        expect(searchStore.set).not.toHaveBeenCalled();
    });
    it('должен очищать ввод от цифр, спецсимволов и лишних пробелов', async () => {
        render(Search);
        const input = page.getByPlaceholder('Search');
        const buttonSearch = page.getByRole('button', { name: 'search'});
        
        await input.fill('  123 Пример   !@# поиска 456  ');
        await buttonSearch.click();

        expect(searchStore.set).toHaveBeenCalledWith('Пример поиска', true);
    });
});

