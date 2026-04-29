import type { ITreeObject, ILink } from "$lib/interface";

// Если длина связи превышает rest × LONG_RATIO — связь считается
// «дальней» и подлежит замене на дублёра рядом с источником.
export const LONG_LINK_RATIO = 2.5;

// «Желаемая» дистанция от источника до тени, в долях суммы размеров
// (та же база, что у пружины).
const GHOST_REST_FACTOR = 0.6;

export type Ghost = {
    sourceId: number;       // якорь — тяжёлый эндпоинт, рядом с которым появилась тень
    originalId: number;     // ID логического объекта, копию которого мы рендерим
    linkId: number;         // ID длинной связи, заменяемой коротким ghost-link
    name: string;
    type?: string;
    size: number;
    mass: number;
    x: number;              // верхний-левый угол копии (как у обычного Object)
    y: number;
};

// Возвращает список «теней» для всех связей, чья длина превышает
// порог. Каждая тень — копия более лёгкого эндпоинта, размещённая
// рядом с тяжёлым на rest-дистанции.
//
// Тени — чисто визуальные: они НЕ попадают в objects/links store-ов,
// не участвуют в физике, не сохраняются в localStorage. Это рендеринг,
// не изменение модели.
export function computeGhosts(
    objects: ITreeObject[],
    links: ILink[],
    longRatio: number = LONG_LINK_RATIO
): Ghost[] {
    const idToObj = new Map<number, ITreeObject>();
    function walk(o: ITreeObject) {
        idToObj.set(o.id, o);
        for (const c of o.objects ?? []) walk(c);
    }
    for (const o of objects) walk(o);

    const ghosts: Ghost[] = [];
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
        const restLength = (a.size + b.size) * GHOST_REST_FACTOR;
        if (dist <= restLength * longRatio) continue;

        // Тяжёлый — якорь, лёгкий — дублируется рядом.
        const heavy = (a.mass ?? 1) >= (b.mass ?? 1) ? a : b;
        const light = heavy === a ? b : a;
        const fromX = heavy.x + heavy.size / 2;
        const fromY = heavy.y + heavy.size / 2;
        const toX = light.x + light.size / 2;
        const toY = light.y + light.size / 2;
        const ndx = toX - fromX;
        const ndy = toY - fromY;
        const nd = Math.hypot(ndx, ndy) || 1;
        const ux = ndx / nd;
        const uy = ndy / nd;

        const ghostDist = (heavy.size + light.size) * GHOST_REST_FACTOR;
        const ghostCX = fromX + ux * ghostDist;
        const ghostCY = fromY + uy * ghostDist;

        ghosts.push({
            sourceId: heavy.id,
            originalId: light.id,
            linkId: l.id,
            name: light.name,
            type: light.type,
            size: light.size,
            mass: light.mass ?? 1,
            x: ghostCX - light.size / 2,
            y: ghostCY - light.size / 2,
        });
    }
    return ghosts;
}
