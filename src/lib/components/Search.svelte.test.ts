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
			globalBtn: page.getByRole('button', { name: 'global' }),
			categoryBtn: page.getByRole('button', { name: 'category' }),
			clearBtn: page.getByRole('button', { name: 'cross' })
		};
	}

	it('ввод', async () => {
		const { input } = setup();

		await input.fill('Svelte 5');

		await expect.element(input).toHaveValue('Svelte 5');
	});
	it('передача в стор', async () => {
		const { input, searchBtn } = setup();

		await input.fill('  123 Пример   !@# поиска 456  ');
		await searchBtn.click();

		expect(searchStore.set).toHaveBeenCalledWith('Пример поиска', expect.any(Array));
	});
	it('переключение глобального поиска, и передача стор', async () => {
		const { input, globalBtn, searchBtn } = setup();

		await globalBtn.click();
		await input.fill('test');
		await searchBtn.click();

		expect(searchStore.set).toHaveBeenCalledWith('test', expect.any(Array));
	});
});
