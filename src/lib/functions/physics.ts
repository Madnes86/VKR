import type { ITreeObject, ILink } from '$lib/interface';
import { diagramSettings, DIAGRAM_DEFAULTS } from '$lib/stores/diagram.svelte';

// Желаемая дистанция между центрами связанных объектов в долях суммы
// размеров. 0.6 даёт лёгкое перекрытие радиусов — связь компактна,
// но коллизия не даёт объектам слиться.
const SPRING_REST_FACTOR = 0.6;

// Возвращает максимальное смещение в текущем кадре. Вызывающая сторона
// использует это значение, чтобы определить состояние покоя и приостановить
// RAF-цикл — при равновесии диаграмма «засыпает» и не жжёт CPU.
export function physics(
	objects: ITreeObject[],
	centerX: number,
	centerY: number,
	links: ILink[] = []
): number {
	const repulsion = diagramSettings.repulsion;
	const gravity = diagramSettings.gravity;
	const spring = diagramSettings.spring;
	const forces = objects.map(() => ({ fx: 0, fy: 0 }));

	// Приоритет #1: Коллизии. Импульс распределяется обратно
	// пропорционально массе — тяжёлые объекты почти не сдвигаются
	// от ударов лёгких, поэтому могут «заякориться» в центре.
	for (let i = 0; i < objects.length; i++) {
		const obj1 = objects[i];
		const centerX1 = obj1.x + obj1.size / 2;
		const centerY1 = obj1.y + obj1.size / 2;
		const m1 = obj1.mass ?? 1;

		for (let j = i + 1; j < objects.length; j++) {
			const obj2 = objects[j];
			const centerX2 = obj2.x + obj2.size / 2;
			const centerY2 = obj2.y + obj2.size / 2;
			const m2 = obj2.mass ?? 1;

			const dx = centerX1 - centerX2;
			const dy = centerY1 - centerY2;
			const dist = Math.sqrt(dx * dx + dy * dy);

			const desiredDist = (obj1.size + obj2.size) * 0.8;

			if (dist < desiredDist && dist > 0.01) {
				const compression = 1 - dist / desiredDist;
				const strength = Math.pow(compression, 2) * repulsion;
				const nx = dx / dist;
				const ny = dy / dist;

				const total = m1 + m2;
				const share1 = m2 / total;
				const share2 = m1 / total;

				forces[i].fx += nx * strength * share1;
				forces[i].fy += ny * strength * share1;
				forces[j].fx -= nx * strength * share2;
				forces[j].fy -= ny * strength * share2;
			}
		}
	}

	// Приоритет #2: Гравитация к центру. Сила ∝ mass², чтобы тяжёлые
	// тянулись к центру существенно сильнее лёгких — формируются
	// дискретные «орбиты» по массе в равновесии с отталкиванием.
	for (let i = 0; i < objects.length; i++) {
		const obj1 = objects[i];
		const centerX1 = obj1.x + obj1.size / 2;
		const centerY1 = obj1.y + obj1.size / 2;
		const m = obj1.mass ?? 1;

		const dx = centerX - centerX1;
		const dy = centerY - centerY1;
		const dist = Math.sqrt(dx * dx + dy * dy);

		if (dist > 1) {
			const test = Math.max(dist / 50, 1);
			const strength = gravity * m * m * test;

			forces[i].fx += dx * strength;
			forces[i].fy += dy * strength;
		}
	}

	// Приоритет #3: Пружинные силы вдоль связей. Импульс распределяется
	// обратно пропорционально массе — тяжёлый эндпоинт почти не сдвигается,
	// лёгкий притягивается к нему. Сила действует только при растяжении
	// (dist > restLength), сжатие обрабатывают коллизии.
	if (links.length > 0) {
		const idToIndex = new Map<number, number>();
		for (let i = 0; i < objects.length; i++) idToIndex.set(objects[i].id, i);

		for (const l of links) {
			const idA = typeof l.is === 'object' && l.is !== null ? l.is.id : l.is;
			const idB = typeof l.to === 'object' && l.to !== null ? l.to.id : l.to;
			if (typeof idA !== 'number' || typeof idB !== 'number') continue;
			const ia = idToIndex.get(idA);
			const ib = idToIndex.get(idB);
			if (ia === undefined || ib === undefined) continue;

			const a = objects[ia];
			const b = objects[ib];
			const cax = a.x + a.size / 2;
			const cay = a.y + a.size / 2;
			const cbx = b.x + b.size / 2;
			const cby = b.y + b.size / 2;
			const dx = cbx - cax;
			const dy = cby - cay;
			const dist = Math.sqrt(dx * dx + dy * dy);
			if (dist < 0.01) continue;

			const restLength = (a.size + b.size) * SPRING_REST_FACTOR;
			if (dist <= restLength) continue;

			const extension = dist - restLength;
			const f = spring * extension;
			const nx = dx / dist;
			const ny = dy / dist;
			const mA = a.mass ?? 1;
			const mB = b.mass ?? 1;
			const total = mA + mB;
			const shareA = mB / total;
			const shareB = mA / total;

			forces[ia].fx += nx * f * shareA;
			forces[ia].fy += ny * f * shareA;
			forces[ib].fx -= nx * f * shareB;
			forces[ib].fy -= ny * f * shareB;
		}
	}

	// Применяем силы. Демпфирование ∝ 1/√m: лёгкие реагируют быстрее,
	// тяжёлые инертнее — центральные орбиты визуально стабильнее.
	let maxDisplacement = 0;
	for (let i = 0; i < objects.length; i++) {
		const m = objects[i].mass ?? 1;
		const damping = 0.9 / Math.sqrt(m);
		const dx = forces[i].fx * damping;
		const dy = forces[i].fy * damping;
		objects[i].x += dx;
		objects[i].y += dy;
		const mag = Math.hypot(dx, dy);
		if (mag > maxDisplacement) maxDisplacement = mag;
	}
	return maxDisplacement;
}
// Default-порог покоя в виде константы (для тестов и legacy-импортов).
// Реальный пороговый ран-таймовый — diagramSettings.restThreshold.
export const REST_THRESHOLD = DIAGRAM_DEFAULTS.restThreshold;
// Сколько подряд кадров с низким смещением требуется для засыпания.
// 60 кадров ≈ 1 секунда непрерывного покоя.
export const REST_FRAMES = 60;

type LoopOptions = {
	getObjects: () => ITreeObject[];
	getLinks?: () => ILink[];
	getCenter: () => { x: number; y: number };
	isPaused?: () => boolean;
	onWakeSignal?: (wake: () => void) => () => void;
};

// Запускает RAF-цикл физики с детекцией состояния покоя. Когда система
// устаканивается — RAF не планируется, CPU не нагружается. Просыпается
// через колбэк onWakeSignal (например, при начале drag или новых данных).
export function runPhysicsLoop(opts: LoopOptions): () => void {
	let frame = 0;
	let sleeping = false;
	let lowFrames = 0;

	function wake() {
		if (!sleeping) return;
		sleeping = false;
		lowFrames = 0;
		frame = requestAnimationFrame(loop);
	}

	function loop() {
		if (sleeping) return;

		const paused = opts.isPaused?.() ?? false;
		if (paused) {
			lowFrames = 0;
		} else {
			const objects = opts.getObjects();
			if (objects.length > 0) {
				const c = opts.getCenter();
				const links = opts.getLinks?.() ?? [];
				const maxMove = physics(objects, c.x, c.y, links);
				if (maxMove < diagramSettings.restThreshold) {
					lowFrames++;
					if (lowFrames >= REST_FRAMES) {
						sleeping = true;
						return;
					}
				} else {
					lowFrames = 0;
				}
			}
		}

		frame = requestAnimationFrame(loop);
	}

	const unsub = opts.onWakeSignal?.(wake);
	frame = requestAnimationFrame(loop);

	return () => {
		cancelAnimationFrame(frame);
		unsub?.();
	};
}

export function resizeObjects(objects: ITreeObject[], scale: number) {
	const baseSize = diagramSettings.baseSize;
	objects.forEach((e) => {
		e.size = baseSize * (e.mass ?? 1) * scale;
		if (e.objects && e.objects.length > 0) {
			resizeObjects(e.objects, scale);
		}
	});
}
