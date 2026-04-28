/**
 * Правила-циклы.
 *
 * cycle_links     — направленный цикл по графу связей (a→b→c→a).
 *                    Серьёзность: warning. Циклы в графе нередко
 *                    осмысленны (взаимные ссылки), но дают повод
 *                    задуматься.
 * cycle_parents   — цикл в parent-цепочке. Это сломанное дерево, не
 *                    может рендериться корректно. Серьёзность: error.
 *
 * DFS со стэком visited — стандартная схема обнаружения цикла в
 * orgraph. Для родителей дополнительно учитываем, что у каждого
 * объекта максимум один parent — поэтому это просто walk-up до root
 * с проверкой на повтор.
 */

import type { IFlatLink, IFlatObject } from '$lib/interface';
import type { Issue } from './types';


export function detectLinkCycles(
    objects: IFlatObject[],
    links: IFlatLink[],
): Issue[] {
    const adj: Map<number, { to: number; linkId: number }[]> = new Map();
    for (const l of links) {
        if (l.is === l.to) continue; // self-link отдельным правилом
        if (!adj.has(l.is)) adj.set(l.is, []);
        adj.get(l.is)!.push({ to: l.to, linkId: l.id });
    }

    const objectIds = new Set(objects.map(o => o.id));
    const WHITE = 0, GRAY = 1, BLACK = 2;
    const color = new Map<number, number>();

    const issues: Issue[] = [];
    const seenCycleSignatures = new Set<string>();

    function dfs(node: number, stack: number[], stackLinks: number[]) {
        color.set(node, GRAY);
        stack.push(node);

        for (const { to, linkId } of adj.get(node) ?? []) {
            if (!objectIds.has(to)) continue;
            const c = color.get(to) ?? WHITE;
            if (c === GRAY) {
                // нашли цикл — выделяем участок stack, начиная с to
                const start = stack.indexOf(to);
                const cycleNodes = stack.slice(start);
                const cycleLinks = [...stackLinks.slice(start), linkId];
                const sig = [...cycleNodes].sort((a, b) => a - b).join(',');
                if (!seenCycleSignatures.has(sig)) {
                    seenCycleSignatures.add(sig);
                    issues.push({
                        code: 'cycle_links',
                        severity: 'warning',
                        message: `Цикл из ${cycleNodes.length} узлов: ${cycleNodes.join(' → ')} → ${to}`,
                        targets: [
                            ...cycleNodes.map(id => ({ kind: 'object' as const, id })),
                            ...cycleLinks.map(id => ({ kind: 'link' as const, id })),
                        ],
                    });
                }
            } else if (c === WHITE) {
                stackLinks.push(linkId);
                dfs(to, stack, stackLinks);
                stackLinks.pop();
            }
        }

        stack.pop();
        color.set(node, BLACK);
    }

    for (const o of objects) {
        if ((color.get(o.id) ?? WHITE) === WHITE) {
            dfs(o.id, [], []);
        }
    }
    return issues;
}


export function detectParentCycles(objects: IFlatObject[]): Issue[] {
    const parentOf = new Map<number, number | null>();
    for (const o of objects) parentOf.set(o.id, o.parent);

    const issues: Issue[] = [];
    const seen = new Set<string>();

    for (const o of objects) {
        const visited: number[] = [];
        let cur: number | null | undefined = o.id;
        while (cur !== null && cur !== undefined) {
            if (visited.includes(cur)) {
                const start = visited.indexOf(cur);
                const cycleNodes = visited.slice(start);
                const sig = [...cycleNodes].sort((a, b) => a - b).join(',');
                if (!seen.has(sig)) {
                    seen.add(sig);
                    issues.push({
                        code: 'cycle_parents',
                        severity: 'error',
                        message: `Цикл в parent-цепочке: ${cycleNodes.join(' → ')} → ${cur}`,
                        targets: cycleNodes.map(id => ({ kind: 'object' as const, id })),
                    });
                }
                break;
            }
            visited.push(cur);
            cur = parentOf.get(cur) ?? null;
        }
    }
    return issues;
}
