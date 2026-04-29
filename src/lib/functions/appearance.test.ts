import { describe, expect, it } from 'vitest';
import { computeAppearanceOrder, REVEAL_DELAY } from './appearance';
import type { ITreeObject, ILink } from '$lib/interface';

function obj(id: number, mass: number): ITreeObject {
    return {
        id,
        name: `o${id}`,
        type: 'default',
        x: 0,
        y: 0,
        size: 100 * mass,
        mass,
        objects: [],
        links: [],
    };
}

function link(id: number, is: number, to: number): ILink {
    return { id, name: `l${id}`, type: 'default', is, to };
}

describe('computeAppearanceOrder', () => {
    it('Пустой массив возвращает пустой', () => {
        expect(computeAppearanceOrder([], [])).toEqual([]);
    });

    it('Один объект — порядок тривиальный', () => {
        expect(computeAppearanceOrder([obj(1, 5)], [])).toEqual([1]);
    });

    it('Сортирует по массе по убыванию (без связей)', () => {
        const objects = [obj(1, 1), obj(2, 5), obj(3, 3)];
        expect(computeAppearanceOrder(objects, [])).toEqual([2, 3, 1]);
    });

    it('Первым идёт самый массивный, потом связанные с ним', () => {
        // 1 (mass 10) — корень. 2 и 3 связаны с ним. 4 — изолированный.
        // Хотя 4 (mass=4) тяжелее 2 (mass=2) и 3 (mass=3), они должны
        // появиться раньше из-за связи с показанным корнем.
        const objects = [obj(1, 10), obj(2, 2), obj(3, 3), obj(4, 4)];
        const links = [link(100, 1, 2), link(101, 1, 3)];

        const order = computeAppearanceOrder(objects, links);

        expect(order[0]).toBe(1);
        expect(order.slice(1, 3).sort()).toEqual([2, 3]);
        expect(order[3]).toBe(4);
    });

    it('Листья с минимальной массой идут последними', () => {
        // Дерево: 1 (mass 5) — корень, 2 и 3 — дети (mass 2 и 3),
        // 4 — лист с mass=1, связан с 3.
        const objects = [obj(1, 5), obj(2, 2), obj(3, 3), obj(4, 1)];
        const links = [link(100, 1, 2), link(101, 1, 3), link(102, 3, 4)];

        const order = computeAppearanceOrder(objects, links);

        expect(order[0]).toBe(1);
        expect(order[order.length - 1]).toBe(4);
    });

    it('Ссылки на ITreeObject (не numeric) обрабатываются корректно', () => {
        const a = obj(1, 5);
        const b = obj(2, 3);
        const c = obj(3, 2);
        const links: ILink[] = [
            { id: 100, name: 'l', type: 'default', is: a, to: b },
        ];

        const order = computeAppearanceOrder([a, b, c], links);

        expect(order[0]).toBe(1);
        expect(order[1]).toBe(2); // связан с a → раньше изолированного c
        expect(order[2]).toBe(3);
    });

    it('Возвращает все ID без потерь и дублирования', () => {
        const objects = [obj(1, 5), obj(2, 5), obj(3, 5), obj(4, 5)];
        const links = [link(100, 1, 2), link(101, 3, 4)];

        const order = computeAppearanceOrder(objects, links);

        expect(order.length).toBe(4);
        expect(new Set(order)).toEqual(new Set([1, 2, 3, 4]));
    });

    it('REVEAL_DELAY = 300мс по требованию', () => {
        expect(REVEAL_DELAY).toBe(300);
    });
});
