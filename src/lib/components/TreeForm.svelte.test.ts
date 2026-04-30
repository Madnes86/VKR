import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import TreeForm from './TreeForm.svelte';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import { objects, selectedStore } from '$lib/stores/objects.svelte';

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

function makeDataTransfer(): DataTransfer {
	const store = new Map<string, string>();
	const types: string[] = [];
	const dt = {
		effectAllowed: 'none',
		dropEffect: 'none',
		types: types as unknown as readonly string[],
		setData(type: string, value: string) {
			if (!types.includes(type)) types.push(type);
			store.set(type, value);
		},
		getData(type: string) {
			return store.get(type) ?? '';
		},
		clearData() {
			store.clear();
			types.length = 0;
		}
	} as unknown as DataTransfer;
	return dt;
}

describe('TreeForm — drag-and-drop объектов из дерева', () => {
	beforeEach(() => {
		objects.clear();
		selectedStore.clearAll();
	});
	afterEach(() => {
		objects.clear();
		selectedStore.clearAll();
	});

	function renderRow(id: number) {
		objects.setAll([
			...objects.all,
			{ id, name: `o-${id}`, type: 'default', parent: null, content: null }
		]);
		return render(TreeForm, {
			props: { id, name: `o-${id}`, type: 'o', query: '', more: false }
		}).container.querySelector('[data-testid="row"]') as HTMLElement;
	}

	it('Без выделения dragstart кладёт payload с одним id', () => {
		const row = renderRow(7);
		const dt = makeDataTransfer();
		row.dispatchEvent(
			Object.assign(new Event('dragstart', { bubbles: true }), { dataTransfer: dt })
		);
		const payload = JSON.parse(dt.getData('application/x-structura-objects'));
		expect(payload).toEqual([7]);
	});

	it('Если строка в multi-группе, dragstart кладёт ВСЕ id группы', () => {
		const row7 = renderRow(7);
		renderRow(8);
		renderRow(9);
		// Помещаем 7,8,9 в одну группу.
		selectedStore.setMulti(['o + 7', 'o + 8', 'o + 9'], null);
		const dt = makeDataTransfer();
		row7.dispatchEvent(
			Object.assign(new Event('dragstart', { bubbles: true }), { dataTransfer: dt })
		);
		const payload = JSON.parse(dt.getData('application/x-structura-objects')) as number[];
		expect(payload.sort()).toEqual([7, 8, 9]);
	});

	it('Если drag-source НЕ в группе — тянет только себя, чужую группу не цепляет', () => {
		const row5 = renderRow(5);
		renderRow(8);
		renderRow(9);
		selectedStore.setMulti(['o + 8', 'o + 9'], null); // 5 не в группе
		const dt = makeDataTransfer();
		row5.dispatchEvent(
			Object.assign(new Event('dragstart', { bubbles: true }), { dataTransfer: dt })
		);
		const payload = JSON.parse(dt.getData('application/x-structura-objects'));
		expect(payload).toEqual([5]);
	});

	it('Связи (type=l) — не draggable, payload не пишется', () => {
		const { container } = render(TreeForm, {
			props: { id: 100, name: 'L', type: 'l', query: '', more: false }
		});
		const row = container.querySelector('[data-testid="row"]') as HTMLElement;
		expect(row.getAttribute('draggable')).toBe('false');
	});
});
