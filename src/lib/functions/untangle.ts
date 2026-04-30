import type { ITreeObject, ILink } from '$lib/interface';
import { diagramSettings, DIAGRAM_DEFAULTS } from '$lib/stores/diagram.svelte';

// Default-порог в виде константы (для тестов). Реальный ран-таймовый
// при вызове без override — diagramSettings.longLinkRatio.
export const LONG_LINK_RATIO = DIAGRAM_DEFAULTS.longLinkRatio;

// Та же база, что у пружины — желаемая дистанция между центрами.
const REST_FACTOR = 0.6;

// Перебирает связи и для каждой длинной связи перемещает более лёгкий
// эндпоинт ближе к более тяжёлому, на rest-дистанцию по направлению
// текущего положения. Мутирует obj.x / obj.y у перенесённых объектов
// (физика дальше досадит из новых позиций).
//
// Возвращает количество перенесённых объектов.
//
// Идемпотентно за один проход: если несколько длинных связей ведут к
// одному и тому же листу, перенесение происходит только по первой
// найденной — повторный клик распутает следующее, если требуется.
export function untangleLinks(
	objects: ITreeObject[],
	links: ILink[],
	longRatio: number = diagramSettings.longLinkRatio
): number {
	const idToObj = new Map<number, ITreeObject>();
	function walk(o: ITreeObject) {
		idToObj.set(o.id, o);
		for (const c of o.objects ?? []) walk(c);
	}
	for (const o of objects) walk(o);

	const moved = new Set<number>();
	for (const l of links) {
		const idA = typeof l.is === 'object' && l.is !== null ? l.is.id : l.is;
		const idB = typeof l.to === 'object' && l.to !== null ? l.to.id : l.to;
		if (typeof idA !== 'number' || typeof idB !== 'number') continue;
		const a = idToObj.get(idA);
		const b = idToObj.get(idB);
		if (!a || !b) continue;

		const cax = a.x + a.size / 2;
		const cay = a.y + a.size / 2;
		const cbx = b.x + b.size / 2;
		const cby = b.y + b.size / 2;
		const dist = Math.hypot(cbx - cax, cby - cay);
		const restLength = (a.size + b.size) * REST_FACTOR;
		if (dist <= restLength * longRatio) continue;

		// Тяжёлый — якорь, лёгкий — переносится к нему.
		const heavy = (a.mass ?? 1) >= (b.mass ?? 1) ? a : b;
		const light = heavy === a ? b : a;
		// Один объект не двигаем дважды за проход — чтобы N связей к
		// одному листу не складывались в накопительное смещение.
		if (moved.has(light.id)) continue;

		const fromX = heavy.x + heavy.size / 2;
		const fromY = heavy.y + heavy.size / 2;
		const toX = light.x + light.size / 2;
		const toY = light.y + light.size / 2;
		const ndx = toX - fromX;
		const ndy = toY - fromY;
		const nd = Math.hypot(ndx, ndy) || 1;
		const ux = ndx / nd;
		const uy = ndy / nd;

		const newDist = (heavy.size + light.size) * REST_FACTOR;
		const newCX = fromX + ux * newDist;
		const newCY = fromY + uy * newDist;
		light.x = newCX - light.size / 2;
		light.y = newCY - light.size / 2;
		moved.add(light.id);
	}
	return moved.size;
}
