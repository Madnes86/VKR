import { describe, expect, it } from 'vitest';
import { computeGhosts, LONG_LINK_RATIO } from './ghosts';
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

describe('computeGhosts', () => {
    it('Короткая связь не порождает тень', () => {
        const a = obj(1, 0, 0, 1);
        const b = obj(2, 100, 0, 1); // dist между центрами 100, rest = 200*0.6 = 120
        const ghosts = computeGhosts([a, b], [link(100, 1, 2)]);
        expect(ghosts).toEqual([]);
    });

    it('Длинная связь порождает тень рядом с тяжёлым эндпоинтом', () => {
        const heavy = obj(1, 0, 0, 5, 'heavy');         // size=500, центр (250,250)
        const light = obj(2, 3000, 0, 1, 'light');      // size=100, центр (3050,50)
        const ghosts = computeGhosts([heavy, light], [link(100, 1, 2)]);

        expect(ghosts.length).toBe(1);
        const g = ghosts[0];
        expect(g.sourceId).toBe(1);   // тяжёлый — якорь
        expect(g.originalId).toBe(2); // лёгкий — дублирован
        expect(g.name).toBe('light');
        expect(g.size).toBe(100);
    });

    it('Тень размещается на rest-дистанции от якоря по направлению к оригиналу', () => {
        const heavy = obj(1, 0, 0, 5);
        const light = obj(2, 3000, 0, 1);
        const ghosts = computeGhosts([heavy, light], [link(100, 1, 2)]);
        const g = ghosts[0];

        const fromCX = 250; // heavy center x
        const fromCY = 250; // heavy center y
        const ghostCX = g.x + g.size / 2;
        const ghostCY = g.y + g.size / 2;
        const distFromAnchor = Math.hypot(ghostCX - fromCX, ghostCY - fromCY);
        const expectedDist = (heavy.size + light.size) * 0.6;
        expect(distFromAnchor).toBeCloseTo(expectedDist, 5);

        // направление от heavy к light — вправо (light.x > heavy.x)
        expect(ghostCX).toBeGreaterThan(fromCX);
    });

    it('Множественные дальние связи дают по тени на каждую', () => {
        const root = obj(1, 0, 0, 10);
        const farA = obj(2, 5000, 0, 1);
        const farB = obj(3, 0, 5000, 1);
        const ghosts = computeGhosts(
            [root, farA, farB],
            [link(100, 1, 2), link(101, 1, 3)]
        );
        expect(ghosts.length).toBe(2);
        expect(new Set(ghosts.map(g => g.originalId))).toEqual(new Set([2, 3]));
    });

    it('Орфанная ссылка (нет одного эндпоинта) пропускается', () => {
        const a = obj(1, 0, 0, 1);
        const ghosts = computeGhosts([a], [link(100, 1, 999)]);
        expect(ghosts).toEqual([]);
    });

    it('Кастомный longRatio: при увеличении порога теней меньше', () => {
        const heavy = obj(1, 0, 0, 5);
        const light = obj(2, 1000, 0, 1);
        const links = [link(100, 1, 2)];

        const default_ = computeGhosts([heavy, light], links, LONG_LINK_RATIO);
        const stricter = computeGhosts([heavy, light], links, 100);

        expect(default_.length).toBeGreaterThanOrEqual(stricter.length);
        expect(stricter.length).toBe(0);
    });

    it('Рекурсивно собирает объекты из вложенных детей', () => {
        const child = obj(2, 3000, 0, 1, 'leaf');
        const root: ITreeObject = { ...obj(1, 0, 0, 5, 'root'), objects: [child] };
        const ghosts = computeGhosts([root], [link(100, 1, 2)]);
        expect(ghosts.length).toBe(1);
        expect(ghosts[0].originalId).toBe(2);
    });
});
