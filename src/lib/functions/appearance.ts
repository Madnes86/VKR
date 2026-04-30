import type { ITreeObject, ILink } from '$lib/interface';
import { diagramSettings, DIAGRAM_DEFAULTS } from '$lib/stores/diagram.svelte';

// Default-базис в виде константы (для тестов). Реальный ран-таймовый —
// diagramSettings.revealDelay.
export const BASE_REVEAL_DELAY = DIAGRAM_DEFAULTS.revealDelay;

// Сколько миллисекунд ждать перед появлением следующего объекта,
// если предыдущий имеет массу `mass`. Масса < 1 трактуется как 1
// (минимум одна базовая задержка).
export function getRevealDelay(mass: number): number {
	return diagramSettings.revealDelay * Math.max(1, mass);
}

// Возвращает ID объектов в порядке появления на холсте.
// Дерево раскрывается ПОЛНОСТЬЮ — функция рекурсивно проходит вложенные
// objects, чтобы потомки тоже появлялись постепенно (а не пачкой при
// рендере родителя).
//
// Приоритет:
//   1) тяжёлые объекты (высокая mass) — они якорятся в центре и идут
//      первыми;
//   2) среди равной массы предпочтение тем, кто связан с уже показанными
//      (через явный link или через родитель-ребёнок), чтобы дерево
//      «разворачивалось» от центра, а не появлялось вразнобой;
//   3) лёгкие изолированные листья — последними.
export function computeAppearanceOrder(objects: ITreeObject[], links: ILink[]): number[] {
	const flat: ITreeObject[] = [];
	const adj = new Map<number, Set<number>>();

	function ensure(id: number) {
		if (!adj.has(id)) adj.set(id, new Set());
	}
	function addEdge(a: number, b: number) {
		ensure(a);
		ensure(b);
		adj.get(a)!.add(b);
		adj.get(b)!.add(a);
	}
	function walk(o: ITreeObject) {
		flat.push(o);
		const kids = o.objects ?? [];
		for (const child of kids) {
			addEdge(o.id, child.id);
			walk(child);
		}
		for (const l of o.links ?? []) {
			const a = typeof l.is === 'object' && l.is !== null ? l.is.id : l.is;
			const b = typeof l.to === 'object' && l.to !== null ? l.to.id : l.to;
			if (typeof a === 'number' && typeof b === 'number') addEdge(a, b);
		}
	}
	for (const o of objects) walk(o);

	for (const l of links) {
		const a = typeof l.is === 'object' && l.is !== null ? l.is.id : l.is;
		const b = typeof l.to === 'object' && l.to !== null ? l.to.id : l.to;
		if (typeof a === 'number' && typeof b === 'number') addEdge(a, b);
	}

	if (flat.length <= 1) return flat.map((o) => o.id);

	const result: number[] = [];
	const revealed = new Set<number>();
	const remaining = new Map(flat.map((o) => [o.id, o]));

	while (remaining.size > 0) {
		let best: ITreeObject | null = null;
		let bestConnections = -1;
		let bestMass = -Infinity;

		for (const obj of remaining.values()) {
			const neighbors = adj.get(obj.id);
			let connections = 0;
			if (neighbors) {
				for (const n of neighbors) if (revealed.has(n)) connections++;
			}
			const mass = obj.mass ?? 1;

			if (connections > bestConnections || (connections === bestConnections && mass > bestMass)) {
				best = obj;
				bestConnections = connections;
				bestMass = mass;
			}
		}

		if (!best) break;
		result.push(best.id);
		revealed.add(best.id);
		remaining.delete(best.id);
	}

	return result;
}
