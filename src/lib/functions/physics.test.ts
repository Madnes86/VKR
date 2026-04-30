import { describe, expect, it } from 'vitest';
import { centerObjects, physics, resizeObjects, REST_THRESHOLD } from './physics';
import type { ITreeObject, ILink } from '$lib/interface';

function makeObj(
	partial: Partial<ITreeObject> & { id: number; x: number; y: number; mass: number }
): ITreeObject {
	return {
		id: partial.id,
		name: `obj-${partial.id}`,
		type: 'default',
		x: partial.x,
		y: partial.y,
		size: 100 * partial.mass,
		mass: partial.mass,
		objects: partial.objects ?? [],
		links: partial.links ?? []
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

describe('physics: пружинная сила вдоль связей', () => {
	it('Связанные объекты притягиваются друг к другу', () => {
		// Гравитация перпендикулярна оси связи, чтобы изолировать
		// эффект пружины. Объекты на одной горизонтали, центр сверху.
		const a = makeObj({ id: 1, x: 0, y: 1000, mass: 1 });
		const b = makeObj({ id: 2, x: 2000, y: 1000, mass: 1 });
		const links: ILink[] = [{ id: 100, name: 'l', type: 'default', is: 1, to: 2 }];

		const initialDist = Math.abs(b.x - a.x);

		for (let i = 0; i < 100; i++) physics([a, b], 1000, 1000, links);

		const finalDist = Math.abs(b.x - a.x);
		expect(finalDist).toBeLessThan(initialDist);
	});

	it('При dist <= restLength пружина не вносит вклад (сравнение с/без link)', () => {
		// size=100 каждый → restLength = 200 * 0.6 = 120.
		// Центры на расстоянии 100 — внутри restLength, пружина молчит.
		const linkA = makeObj({ id: 1, x: 0, y: 0, mass: 1 });
		const linkB = makeObj({ id: 2, x: 100, y: 0, mass: 1 });
		const noA = makeObj({ id: 1, x: 0, y: 0, mass: 1 });
		const noB = makeObj({ id: 2, x: 100, y: 0, mass: 1 });
		const links: ILink[] = [{ id: 100, name: 'l', type: 'default', is: 1, to: 2 }];

		physics([linkA, linkB], 1000, 1000, links);
		physics([noA, noB], 1000, 1000, []);

		// Идентичные позиции — пружина действительно не сработала.
		expect(linkA.x).toBeCloseTo(noA.x, 5);
		expect(linkB.x).toBeCloseTo(noB.x, 5);
	});

	it('Лёгкий конец смещается пружиной сильнее тяжёлого (изоляция пружины)', () => {
		// Сравниваем шаг с link и без — гравитация в обоих сценариях
		// одинакова, разница в смещении приходится только на пружину.
		const heavy1 = makeObj({ id: 1, x: 0, y: 1000, mass: 10 });
		const light1 = makeObj({ id: 2, x: 2000, y: 1000, mass: 1 });
		const heavy2 = makeObj({ id: 1, x: 0, y: 1000, mass: 10 });
		const light2 = makeObj({ id: 2, x: 2000, y: 1000, mass: 1 });
		const links: ILink[] = [{ id: 100, name: 'l', type: 'default', is: 1, to: 2 }];

		physics([heavy1, light1], 1000, 1000, links);
		physics([heavy2, light2], 1000, 1000, []);

		const heavySpringDelta = Math.abs(heavy1.x - heavy2.x);
		const lightSpringDelta = Math.abs(light1.x - light2.x);

		expect(lightSpringDelta).toBeGreaterThan(heavySpringDelta);
	});

	it('Несвязанные объекты не притягиваются пружиной', () => {
		const a = makeObj({ id: 1, x: 0, y: 1000, mass: 1 });
		const b = makeObj({ id: 2, x: 2000, y: 1000, mass: 1 });

		const aStartX = a.x;
		const bStartX = b.x;

		// links = []: только гравитация и коллизия
		for (let i = 0; i < 100; i++) physics([a, b], 1000, 1000, []);

		const aShift = Math.abs(a.x - aStartX);
		const bShift = Math.abs(b.x - bStartX);

		// Симулируем то же со связью
		const a2 = makeObj({ id: 1, x: 0, y: 1000, mass: 1 });
		const b2 = makeObj({ id: 2, x: 2000, y: 1000, mass: 1 });
		const linksOn: ILink[] = [{ id: 100, name: 'l', type: 'default', is: 1, to: 2 }];
		for (let i = 0; i < 100; i++) physics([a2, b2], 1000, 1000, linksOn);
		const a2Shift = Math.abs(a2.x - 0);
		const b2Shift = Math.abs(b2.x - 2000);

		expect(a2Shift).toBeGreaterThan(aShift);
		expect(b2Shift).toBeGreaterThan(bShift);
	});

	it('Орфанная ссылка (один эндпоинт отсутствует) не ломает физику', () => {
		const a = makeObj({ id: 1, x: 0, y: 0, mass: 1 });
		const links: ILink[] = [{ id: 100, name: 'l', type: 'default', is: 1, to: 999 }];

		physics([a], 500, 500, links);
		expect(Number.isFinite(a.x)).toBe(true);
	});
});

describe('physics: возврат значения и состояние покоя', () => {
	it('Возвращает число — максимальное смещение в кадре', () => {
		const obj = makeObj({ id: 1, x: 0, y: 0, mass: 1 });
		const result = physics([obj], 500, 500);

		expect(typeof result).toBe('number');
		expect(result).toBeGreaterThan(0);
	});

	it('После долгой симуляции смещение падает ниже REST_THRESHOLD', () => {
		const cx = 500;
		const cy = 500;
		const obj = makeObj({ id: 1, x: 100, y: 100, mass: 1 });

		let last = Infinity;
		for (let i = 0; i < 2000; i++) {
			last = physics([obj], cx, cy);
		}

		expect(last).toBeLessThan(REST_THRESHOLD);
	});

	it('Пустой массив возвращает 0 (нет движения)', () => {
		expect(physics([], 0, 0)).toBe(0);
	});
});

describe('physics: устойчивость', () => {
	it('Объект без массы не ломает симуляцию (NaN-guard)', () => {
		const cx = 500;
		const cy = 500;
		const obj = {
			id: 1,
			name: 'x',
			type: 'default',
			x: 100,
			y: 100,
			size: 100,
			objects: [],
			links: []
		} as ITreeObject;

		simulate([obj], cx, cy, 5);

		expect(Number.isFinite(obj.x)).toBe(true);
		expect(Number.isFinite(obj.y)).toBe(true);
	});
});

describe('centerObjects', () => {
	it('Помещает центр объекта в (cx, cy) с поправкой на size', () => {
		const obj = makeObj({ id: 1, x: 0, y: 0, mass: 1 });
		obj.size = 100;

		centerObjects([obj], 500, 300, 0);

		// центр объекта = x + size/2
		expect(obj.x + obj.size / 2).toBeCloseTo(500, 5);
		expect(obj.y + obj.size / 2).toBeCloseTo(300, 5);
	});

	it('jitter удерживает центры в допуске вокруг (cx, cy)', () => {
		const objs = Array.from({ length: 20 }, (_, i) => {
			const o = makeObj({ id: i, x: 0, y: 0, mass: 1 });
			o.size = 100;
			return o;
		});

		centerObjects(objs, 1000, 1000, 4);

		for (const o of objs) {
			expect(o.x + o.size / 2).toBeGreaterThanOrEqual(1000 - 2);
			expect(o.x + o.size / 2).toBeLessThanOrEqual(1000 + 2);
			expect(o.y + o.size / 2).toBeGreaterThanOrEqual(1000 - 2);
			expect(o.y + o.size / 2).toBeLessThanOrEqual(1000 + 2);
		}
	});

	it('Перезаписывает «угловой» старт из buildTree (Math.random < 1)', () => {
		// buildTree выдаёт x/y ≈ 0..1 — это «угол». После centerObjects
		// объекты должны быть рядом с центром, а не у (0,0).
		const obj = makeObj({ id: 1, x: 0.4, y: 0.7, mass: 1 });
		obj.size = 100;

		centerObjects([obj], 800, 600, 0);

		expect(Math.hypot(obj.x + 50, obj.y + 50)).toBeGreaterThan(100);
		expect(Math.hypot(obj.x + 50 - 800, obj.y + 50 - 600)).toBeLessThan(1);
	});

	it('Пустой массив не падает', () => {
		expect(() => centerObjects([], 0, 0)).not.toThrow();
	});
});

describe('resizeObjects', () => {
	it('Применяет mass × scale, без массы fallback = 1', () => {
		const a = makeObj({ id: 1, x: 0, y: 0, mass: 2 });
		const b = {
			id: 2,
			name: 'b',
			type: 'default',
			x: 0,
			y: 0,
			size: 0,
			objects: [],
			links: []
		} as ITreeObject;

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
