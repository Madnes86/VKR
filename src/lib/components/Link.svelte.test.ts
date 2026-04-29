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

    it('Размер наконечника стрелки масштабируется по размеру эндпоинтов', () => {
        const isSmall = { id: 1, name: 'A', x: 0, y: 0, size: 100 } as any;
        const toSmall = { id: 2, name: 'B', x: 200, y: 0, size: 100 } as any;
        const small = render(Link, {
            props: { id: 100, name: 'L', type: 'default', is: isSmall, to: toSmall, toValue: true },
        });
        const smallMarker = small.container.querySelector('marker');
        const smallSize = parseFloat(smallMarker!.getAttribute('markerWidth')!);

        const isBig = { id: 1, name: 'A', x: 0, y: 0, size: 800 } as any;
        const toBig = { id: 2, name: 'B', x: 1000, y: 0, size: 800 } as any;
        const big = render(Link, {
            props: { id: 101, name: 'L', type: 'default', is: isBig, to: toBig, toValue: true },
        });
        const bigMarker = big.container.querySelector('marker');
        const bigSize = parseFloat(bigMarker!.getAttribute('markerWidth')!);

        expect(bigSize).toBeGreaterThan(smallSize);
    });

    it('Минимальный размер наконечника не меньше 4', () => {
        const isTiny = { id: 1, name: 'A', x: 0, y: 0, size: 10 } as any;
        const toTiny = { id: 2, name: 'B', x: 50, y: 0, size: 10 } as any;
        const { container } = render(Link, {
            props: { id: 100, name: 'L', type: 'default', is: isTiny, to: toTiny, toValue: true },
        });
        const marker = container.querySelector('marker');
        const w = parseFloat(marker!.getAttribute('markerWidth')!);
        expect(w).toBeGreaterThanOrEqual(4);
    });

    it('Кнопка-флип меняет местами is и to через linksStore', async () => {
        const { links: linksStore } = await import('$lib/stores/objects.svelte');
        // Подменяем update на шпион — проверяем, что вызвался с patch swap.
        const calls: Array<{ id: number; patch: any }> = [];
        const original = linksStore.update.bind(linksStore);
        linksStore.update = (id: number, patch: any) => { calls.push({ id, patch }); };
        try {
            const is = { id: 1, name: 'A', x: 0, y: 0, size: 100 } as any;
            const to = { id: 2, name: 'B', x: 200, y: 0, size: 100 } as any;
            render(Link, {
                props: { id: 100, name: 'L', type: 'default', is, to },
            });
            // Hover, чтобы появились кнопки
            await page.getByText('L').hover();
            await page.getByTestId('flip-link').click();

            expect(calls.length).toBe(1);
            expect(calls[0].id).toBe(100);
            expect(calls[0].patch).toEqual({ is: 2, to: 1 });
        } finally {
            linksStore.update = original;
        }
    });
});
