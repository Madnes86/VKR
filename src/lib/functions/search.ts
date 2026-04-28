/**
 * Утилиты поиска: вычисление множества видимых узлов в режиме фильтра.
 *
 * Если узел x матчится по запросу, мы хотим показать не только x, но и
 * всех его предков по parent — иначе в визуальном дереве x окажется
 * подвешен в воздухе (parent скрыт, рендер невозможен). Это и есть
 * computeSearchVisibility.
 */

import type { IFlatObject, IFlatLink, ITreeObject } from "$lib/interface";


/**
 * Возвращает Set id-объектов, которые должны остаться видимыми при
 * applied=true: всех с подходящим именем + их предков по parent-цепочке.
 *
 * Поиск регистронезависимый, по подстроке. Пустой запрос — пустой set
 * (вызывающая сторона должна сама решить, что показывать всё).
 */
export function computeSearchVisibility(
    objects: IFlatObject[],
    query: string,
): Set<number> {
    const q = (query ?? '').toLowerCase().trim();
    const visible = new Set<number>();
    if (!q) return visible;

    const byId = new Map<number, IFlatObject>(objects.map(o => [o.id, o]));

    // Прямые матчи.
    const matched: number[] = [];
    for (const o of objects) {
        if ((o.name ?? '').toLowerCase().includes(q)) {
            matched.push(o.id);
            visible.add(o.id);
        }
    }

    // Подъём до корня: добавляем всех предков. Защита от циклов на случай
    // повреждённого parent — сторонние правила это поймают, мы не валимся.
    for (const start of matched) {
        let cur: number | null | undefined = byId.get(start)?.parent;
        const seen = new Set<number>([start]);
        while (cur !== null && cur !== undefined && !seen.has(cur)) {
            visible.add(cur);
            seen.add(cur);
            cur = byId.get(cur)?.parent;
        }
    }

    return visible;
}


/**
 * Связи для фильтрованного графа: оставляем только те, у которых оба
 * конца входят в visible. Иначе ребро будет указывать в пустоту.
 */
export function filterLinksByVisibility(
    links: IFlatLink[],
    visible: Set<number>,
): IFlatLink[] {
    return links.filter(l => visible.has(l.is) && visible.has(l.to));
}


/**
 * Прокинуть фильтр через целое ITreeObject-дерево: оставить только
 * children, входящие в visible (рекурсивно), и links, у которых оба
 * конца видимы. Корневой узел (виртуальный root buildTree-а с id=0
 * или конкретный объект, выбранный viewStore) — не отбрасываем,
 * иначе ничего не отрендерится.
 */
export function pruneTree(node: ITreeObject, visible: Set<number>): ITreeObject {
    const children = (node.objects ?? [])
        .filter(c => visible.has(c.id))
        .map(c => pruneTree(c, visible));
    const links = (node.links ?? []).filter(
        l => visible.has(l.is) && visible.has(l.to),
    );
    return { ...node, objects: children, links };
}
