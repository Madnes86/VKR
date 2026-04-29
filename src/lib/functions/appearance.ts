import type { ITreeObject, ILink } from "$lib/interface";

// Задержка между появлением соседних объектов в миллисекундах.
export const REVEAL_DELAY = 300;

// Возвращает ID объектов в порядке появления на холсте:
//   1) тяжёлые объекты (высокая mass) идут первыми — они якорятся в центре,
//   2) среди равной массы предпочтение тем, что связаны с уже показанными,
//   3) лёгкие листья (низкая mass, без связей) появляются последними.
//
// Алгоритм — жадный: на каждой итерации выбирается лучший кандидат по
// (число связей с показанными ↓, mass ↓). На первой итерации связей
// ещё нет, поэтому первым всегда станет самый массивный объект.
export function computeAppearanceOrder(objects: ITreeObject[], links: ILink[]): number[] {
    if (objects.length <= 1) return objects.map(o => o.id);

    const adj = new Map<number, Set<number>>();
    for (const l of links) {
        const a = typeof l.is === 'object' && l.is !== null ? l.is.id : l.is;
        const b = typeof l.to === 'object' && l.to !== null ? l.to.id : l.to;
        if (typeof a !== 'number' || typeof b !== 'number') continue;
        if (!adj.has(a)) adj.set(a, new Set());
        if (!adj.has(b)) adj.set(b, new Set());
        adj.get(a)!.add(b);
        adj.get(b)!.add(a);
    }

    const result: number[] = [];
    const revealed = new Set<number>();
    const remaining = new Map(objects.map(o => [o.id, o]));

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

            if (
                connections > bestConnections ||
                (connections === bestConnections && mass > bestMass)
            ) {
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
