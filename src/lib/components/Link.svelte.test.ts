import { describe, expect, it } from 'vitest';
import Link from './Link.svelte';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import { searchStore } from '$lib/stores/search.svelte';

function setup(name = 'Connection') {
    const is = { id: 1, name: 'A', x: 0, y: 0, size: 100 } as any;
    const to = { id: 2, name: 'B', x: 200, y: 0, size: 100 } as any;
    const result = render(Link, {
        props: { id: 100, name, type: 'default', is, to },
    });
    return { ...result };
}

describe('Тестирование компонента связи', () => {
    it('Имя связи отображается', async () => {
        setup('Connection');
        await expect.element(page.getByText('Connection')).toBeVisible();
    });

    it('Имя связи поверх других слоёв (высокий z-index)', () => {
        const { container } = setup('Connection');
        const label = container.querySelector('div.absolute.flex') as HTMLElement | null;
        expect(label).not.toBeNull();
        const z = parseInt(label!.style.zIndex, 10);
        // выше любого реального ID объекта в приложении
        expect(z).toBeGreaterThan(1_000_000);
    });

    it('Подсветка по поиску: совпадение получает класс is-match', async () => {
        searchStore.set('Conn', []);
        try {
            const { container } = setup('Connection');
            const matched = container.querySelectorAll('.is-match');
            expect(matched.length).toBe(4); // 'Conn'
        } finally {
            searchStore.set('', []);
        }
    });

    it('Без запроса подсветки нет', () => {
        searchStore.set('', []);
        const { container } = setup('Connection');
        const matched = container.querySelectorAll('.is-match');
        expect(matched.length).toBe(0);
    });
});
