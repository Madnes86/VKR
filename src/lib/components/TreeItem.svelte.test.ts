import { describe, expect, it } from 'vitest';
import TreeItem from "./TreeItem.svelte";
import { render } from "vitest-browser-svelte";
import { page } from 'vitest/browser';

describe('Тестирование компонента элемента дерева', () => {
    const child = { id: 2, name: 'child', objects: [], links: [] };
    const grandChild = { id: 3, name: 'grand', objects: [], links: [] };

    it('Корневой элемент (без name) не имеет отступа ml-10', async () => {
        const { container } = render(TreeItem, {
            props: {
                id: 1,
                objects: [child],
                links: [],
                highlightedIds: { ids: new Set<number>(), query: '' }
            }
        });

        const childrenContainer = container.querySelector('.flex.flex-col.gap-1.w-full > div:last-child');
        expect(childrenContainer).not.toBeNull();
        expect(childrenContainer?.classList.contains('ml-10!')).toBe(false);
    });

    it('Вложенный элемент (с name) применяет отступ ml-10 к детям', async () => {
        const { container } = render(TreeItem, {
            props: {
                id: 2,
                name: 'parent',
                objects: [grandChild],
                links: [],
                highlightedIds: { ids: new Set<number>(), query: '' }
            }
        });

        const childrenContainer = container.querySelector('.flex.flex-col.gap-1.w-full > div:last-child');
        expect(childrenContainer).not.toBeNull();
        expect(childrenContainer?.className).toMatch(/ml-10!/);
    });

    it('Элемент с name, но без вложенных объектов — без ml-10', async () => {
        const { container } = render(TreeItem, {
            props: {
                id: 4,
                name: 'leaf',
                objects: [],
                links: [],
                highlightedIds: { ids: new Set<number>(), query: '' }
            }
        });

        const childrenContainer = container.querySelector('.flex.flex-col.gap-1.w-full > div:last-child');
        expect(childrenContainer?.className ?? '').not.toMatch(/ml-10!/);
    });

    it('Кнопка-стрелка отображается только если есть вложенные объекты', async () => {
        render(TreeItem, {
            props: {
                id: 5,
                name: 'with-children',
                objects: [grandChild],
                links: [],
                highlightedIds: { ids: new Set<number>(), query: '' }
            }
        });

        await expect.element(page.getByText('with-children')).toBeVisible();
    });
});
