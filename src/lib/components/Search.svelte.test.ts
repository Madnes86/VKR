import { page } from 'vitest/browser';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Search from './Search.svelte';
import { searchStore } from '$lib/stores/search.svelte';
import { categoryes } from '$lib/mocs/categoryes';


vi.mock('$lib/stores/search.svelte', () => ({
    searchStore: {
        set: vi.fn()
    }
}));

describe('Компонент поиска', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });
    function setup() {
        render(Search);
        return {
            input: page.getByPlaceholder('Search'),
            searchBtn: page.getByRole('button', { name: 'search' }),
            globalBtn: page.getByRole('button', { name: 'global'}),
            categoryBtn: page.getByRole('button', { name: 'category'}),
            clearBtn: page.getByRole('button', { name: 'cross' })
        };
    }

    it('ввод', async () => {
        const { input } = setup();

        await input.fill('Svelte 5');

        await expect.element(input).toHaveValue('Svelte 5');
    });
    it('пустой ввод', async () => {
        const { input, searchBtn } = setup();
    
        await input.fill(' ');
        await expect.element(input).toHaveValue(' ');
        await searchBtn.click();

        expect(searchStore.set).not.toHaveBeenCalled();
    });
    it('передача в стор', async () => {
        const { input, searchBtn } = setup();
        
        await input.fill('  123 Пример   !@# поиска 456  ');
        await searchBtn.click();

        expect(searchStore.set).toHaveBeenCalledWith('Пример поиска', true);
    });
    it('переключение глобального поиска, и передача стор', async () => {
        const { input, globalBtn, searchBtn } = setup(); 

        await globalBtn.click();
        await input.fill('test');
        await searchBtn.click();
        
        expect(searchStore.set).toHaveBeenCalledWith('test', false);
    });
    it('появление категорий поиска', async () => {
        const { categoryBtn } = setup();

        const menu = page.getByRole('group', { name: 'cats-menu'});
        await expect.element(menu).not.toBeInTheDocument();
        await categoryBtn.click();
        await expect.element(menu).toBeVisible();
    });
    it('выбор категории поиска', async () => {
        const { categoryBtn } = setup();

        await categoryBtn.click();
        for (const cat of categoryes) {
            const checkbox = page.getByRole('checkbox', { name: cat.name, exact: true });
            
            await expect.element(checkbox).not.toBeChecked;
            await checkbox.click();
            await expect.element(checkbox).toBeChecked;
        }
    });
    it('поиск с учетом категорий', );
});

