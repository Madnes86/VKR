import { describe, expect, it } from 'vitest';
import { untangleLinks, LONG_LINK_RATIO } from './untangle';
import type { ITreeObject, ILink } from '$lib/interface';

function obj(id: number, x: number, y: number, mass: number, name = `o${id}`): ITreeObject {
    return {
        id, name, type: 'default', x, y,
        size: 100 * mass,
        mass,
        objects: [], links: [],
    };
}
function link(id: number, is: number, to: number): ILink {
    return { id, name: `l${id}`, type: 'default', is, to };
}

describe('untangleLinks', () => {
    it('Короткая связь не вызывает перенос', () => {
        const a = obj(1, 0, 0, 1);
        const b = obj(2, 100, 0, 1);
        const startB = { x: b.x, y: b.y };
        const moved = untangleLinks([a, b], [link(100, 1, 2)]);
        expect(moved).toBe(0);
        expect(b.x).toBe(startB.x);
        expect(b.y).toBe(startB.y);
    });

    it('Длинная связь переносит лёгкий эндпоинт к тяжёлому', () => {
        const heavy = obj(1, 0, 0, 5);          // size 500, центр (250, 250)
        const light = obj(2, 3000, 0, 1);       // size 100, центр (3050, 50)
        const lightStartX = light.x;

        const moved = untangleLinks([heavy, light], [link(100, 1, 2)]);

        expect(moved).toBe(1);
        // Лёгкий теперь близко к тяжёлому
        const newDist = Math.hypot(
            (light.x + light.size / 2) - (heavy.x + heavy.size / 2),
            (light.y + light.size / 2) - (heavy.y + heavy.size / 2)
        );
        expect(newDist).toBeCloseTo((heavy.size + light.size) * 0.6, 5);
        // Тяжёлый не двинулся
        expect(heavy.x).toBe(0);
        expect(heavy.y).toBe(0);
        // Лёгкий действительно переехал
        expect(light.x).not.toBe(lightStartX);
    });

    it('Тяжёлый никогда не двигается, лёгкий — да', () => {
        const heavy = obj(1, 100, 200, 10);
        const light = obj(2, 5000, 200, 1);
        const heavyStart = { x: heavy.x, y: heavy.y };

        untangleLinks([heavy, light], [link(100, 1, 2)]);

        expect(heavy.x).toBe(heavyStart.x);
        expect(heavy.y).toBe(heavyStart.y);
    });

    it('Один объект не переносится дважды за проход (накопительное смещение)', () => {
        const root1 = obj(1, 0, 0, 5);
        const root2 = obj(2, 0, 1000, 5);
        const leaf = obj(3, 5000, 5000, 1);

        const moved = untangleLinks(
            [root1, root2, leaf],
            [link(100, 1, 3), link(101, 2, 3)]
        );

        expect(moved).toBe(1); // только один перенос за проход
    });

    it('Несколько разных листьев двигаются за один проход', () => {
        const root = obj(1, 0, 0, 10);
        const farA = obj(2, 5000, 0, 1);
        const farB = obj(3, 0, 5000, 1);

        const moved = untangleLinks(
            [root, farA, farB],
            [link(100, 1, 2), link(101, 1, 3)]
        );

        expect(moved).toBe(2);
    });

    it('Орфанная ссылка пропускается', () => {
        const a = obj(1, 0, 0, 1);
        const moved = untangleLinks([a], [link(100, 1, 999)]);
        expect(moved).toBe(0);
        expect(a.x).toBe(0);
    });

    it('Рекурсивно ищет объекты во вложенных детях', () => {
        const child = obj(2, 5000, 0, 1, 'leaf');
        const root: ITreeObject = { ...obj(1, 0, 0, 5, 'root'), objects: [child] };
        const moved = untangleLinks([root], [link(100, 1, 2)]);
        expect(moved).toBe(1);
        // child мутирован — он теперь близко к root
        const dist = Math.hypot(
            (child.x + child.size / 2) - (root.x + root.size / 2),
            (child.y + child.size / 2) - (root.y + root.size / 2)
        );
        expect(dist).toBeCloseTo((root.size + child.size) * 0.6, 5);
    });

    it('Кастомный longRatio влияет на порог', () => {
        const heavy = obj(1, 0, 0, 5);
        const light = obj(2, 1000, 0, 1);
        const links = [link(100, 1, 2)];

        // Скопируем для двух прогонов
        const heavy2 = obj(1, 0, 0, 5);
        const light2 = obj(2, 1000, 0, 1);

        const movedDefault = untangleLinks([heavy, light], links, LONG_LINK_RATIO);
        const movedStrict = untangleLinks([heavy2, light2], links, 100);

        expect(movedStrict).toBe(0);
        expect(movedDefault).toBeGreaterThanOrEqual(movedStrict);
    });
});
