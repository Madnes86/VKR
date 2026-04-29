import { describe, expect, it } from 'vitest';
import { physics, resizeObjects } from './physics';
import type { ITreeObject } from '$lib/interface';

function makeObj(partial: Partial<ITreeObject> & { id: number; x: number; y: number; mass: number }): ITreeObject {
    return {
        id: partial.id,
        name: `obj-${partial.id}`,
        type: 'default',
        x: partial.x,
        y: partial.y,
        size: 100 * partial.mass,
        mass: partial.mass,
        objects: partial.objects ?? [],
        links: partial.links ?? [],
    };
}

function distFromCenter(obj: ITreeObject, cx: number, cy: number) {
    const ox = obj.x + obj.size / 2;
    const oy = obj.y + obj.size / 2;
    return Math.hypot(cx - ox, cy - oy);
}

function simulate(objects: ITreeObject[], cx: number, cy: number, ticks: number) {
    for (let t = 0; t < ticks; t++) physics(objects, cx, cy);
}

describe('physics: гравитация к центру', () => {
    it('Один объект притягивается к центру', () => {
        const cx = 1000;
        const cy = 500;
        const obj = makeObj({ id: 1, x: 0, y: 0, mass: 1 });
        const initial = distFromCenter(obj, cx, cy);

        simulate([obj], cx, cy, 200);

        expect(distFromCenter(obj, cx, cy)).toBeLessThan(initial);
    });

    it('Тяжёлый объект приближается к центру быстрее лёгкого', () => {
        const cx = 1000;
        const cy = 500;
        const heavy = makeObj({ id: 1, x: 0, y: 0, mass: 4 });
        const light = makeObj({ id: 2, x: 0, y: 1000, mass: 1 });

        const heavyStart = distFromCenter(heavy, cx, cy);
        const lightStart = distFromCenter(light, cx, cy);

        // симулируем независимо, чтобы исключить взаимодействие
        simulate([heavy], cx, cy, 50);
        simulate([light], cx, cy, 50);

        const heavyMoved = heavyStart - distFromCenter(heavy, cx, cy);
        const lightMoved = lightStart - distFromCenter(light, cx, cy);

        expect(heavyMoved).toBeGreaterThan(lightMoved);
    });
});

describe('physics: коллизии с учётом массы', () => {
    it('Лёгкий объект отталкивается дальше тяжёлого при ударе', () => {
        // Центр гравитации лежит на оси столкновения между объектами,
        // чтобы её вклад в ось x был мал по сравнению с импульсом удара.
        // Размеры объектов: heavy.size=500, light.size=100.
        const heavy = makeObj({ id: 1, x: 0, y: 0, mass: 5 });
        const light = makeObj({ id: 2, x: 500, y: 200, mass: 1 });
        const cx = 400;
        const cy = 250;

        const heavyStartX = heavy.x;
        const lightStartX = light.x;

        physics([heavy, light], cx, cy);

        const heavyShift = Math.abs(heavy.x - heavyStartX);
        const lightShift = Math.abs(light.x - lightStartX);

        expect(lightShift).toBeGreaterThan(heavyShift);
    });

    it('Равные массы отталкиваются симметрично', () => {
        // Центр гравитации ровно посередине между объектами.
        const a = makeObj({ id: 1, x: 0, y: 0, mass: 1 });
        const b = makeObj({ id: 2, x: 80, y: 0, mass: 1 });
        const cx = 90;
        const cy = 50;

        physics([a, b], cx, cy);

        const aShift = Math.abs(a.x - 0);
        const bShift = Math.abs(b.x - 80);

        expect(Math.abs(aShift - bShift)).toBeLessThan(0.01);
    });
});

describe('physics: формирование «колец» по массе', () => {
    it('Тяжёлый объект устанавливается ближе к центру, чем лёгкий', () => {
        const cx = 500;
        const cy = 500;
        // оба стартуют на одинаковом расстоянии от центра, по разным сторонам
        const heavy = makeObj({ id: 1, x: 100, y: 500, mass: 5 });
        const light = makeObj({ id: 2, x: 900, y: 500, mass: 1 });

        simulate([heavy, light], cx, cy, 1000);

        const heavyDist = distFromCenter(heavy, cx, cy);
        const lightDist = distFromCenter(light, cx, cy);

        expect(heavyDist).toBeLessThan(lightDist);
    });
});

describe('physics: устойчивость', () => {
    it('Объект без массы не ломает симуляцию (NaN-guard)', () => {
        const cx = 500;
        const cy = 500;
        const obj = { id: 1, name: 'x', type: 'default', x: 100, y: 100, size: 100, objects: [], links: [] } as ITreeObject;

        simulate([obj], cx, cy, 5);

        expect(Number.isFinite(obj.x)).toBe(true);
        expect(Number.isFinite(obj.y)).toBe(true);
    });
});

describe('resizeObjects', () => {
    it('Применяет mass × scale, без массы fallback = 1', () => {
        const a = makeObj({ id: 1, x: 0, y: 0, mass: 2 });
        const b = { id: 2, name: 'b', type: 'default', x: 0, y: 0, size: 0, objects: [], links: [] } as ITreeObject;

        resizeObjects([a, b], 1.5);

        expect(a.size).toBe(100 * 2 * 1.5);
        expect(b.size).toBe(100 * 1 * 1.5);
    });

    it('Рекурсивно обрабатывает вложенные объекты', () => {
        const child = makeObj({ id: 2, x: 0, y: 0, mass: 1 });
        const parent = makeObj({ id: 1, x: 0, y: 0, mass: 3, objects: [child] });

        resizeObjects([parent], 2);

        expect(parent.size).toBe(600);
        expect(child.size).toBe(200);
    });
});
