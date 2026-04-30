import { describe, expect, it, vi, beforeEach } from 'vitest';
import TreeForm from './TreeForm.svelte';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';

describe('Тестирование компонента формы для дерева', () => {
	function setup() {
		render(TreeForm, {
			props: {
				id: 1,
				name: 'root',
				type: 'o',
				query: '',
				more: true
			}
		});
		return {
			main: () => page.getByRole('button').first(),
			buttonRead: () => page.getByRole('button').last(),
			input: () => page.getByRole('textbox'),
			getNameText: (text: string) => page.getByText(text),
			wrapper: () => page.getByTestId('row')
		};
	}
	it('Наведение', async () => {
		const { wrapper } = setup();

		await wrapper().hover();
		await expect.element(wrapper()).toHaveClass(/outline-accent/);
	});
	it('Выбор', async () => {
		const { main, wrapper } = setup();

		await main().click();
		await expect.element(wrapper()).toHaveClass(/border-accent/);
	});
	it('Переключение состояния', async () => {
		const { wrapper, input, buttonRead, getNameText } = setup();

		await expect.element(getNameText('root')).toBeVisible();
		await expect.element(getNameText('root')).toHaveTextContent('root');

		await wrapper().hover();
		await expect.element(buttonRead()).toBeVisible();
		await buttonRead().click();
		await expect.element(input()).toBeVisible();
		await expect.element(input()).toHaveValue('root');
	});
	it('Редактирование названия', async () => {
		const { wrapper, input, buttonRead, getNameText } = setup();

		await wrapper().hover();
		await buttonRead().click();

		await expect.element(input()).toHaveValue('root');
		await input().fill('good');

		await buttonRead().click();
		await expect.element(getNameText('good')).toBeVisible();
		await expect.element(getNameText('good')).toHaveTextContent('good');
	});
	// it('Изминение типа')
});
