/**
 * Правила, связанные с именами.
 *
 * duplicate_name   — два или более объекта с одним именем (case-
 *                    insensitive, обрезаются пробелы) под одним
 *                    родителем. Severity: warning. На разных уровнях
 *                    дублирование допустимо (это разные сущности).
 * empty_name       — пустое или пробельное имя у объекта или связи.
 *                    Severity: warning. Само по себе не ломает граф,
 *                    но мешает читать диаграмму.
 */

import type { IFlatLink, IFlatObject } from '$lib/interface';
import type { Issue } from './types';


function normalize(name: string | null | undefined): string {
    return (name ?? '').trim().toLowerCase();
}


export function detectDuplicateNames(objects: IFlatObject[]): Issue[] {
    const buckets = new Map<string, IFlatObject[]>();
    for (const o of objects) {
        const norm = normalize(o.name);
        if (!norm) continue; // пустые имена — отдельным правилом
        const key = `${o.parent ?? 'root'}::${norm}`;
        if (!buckets.has(key)) buckets.set(key, []);
        buckets.get(key)!.push(o);
    }

    const issues: Issue[] = [];
    for (const [, group] of buckets) {
        if (group.length < 2) continue;
        issues.push({
            code: 'duplicate_name',
            severity: 'warning',
            message: `${group.length} объекта с именем «${group[0].name}» под одним родителем`,
            targets: group.map(o => ({ kind: 'object' as const, id: o.id })),
        });
    }
    return issues;
}


export function detectEmptyNames(
    objects: IFlatObject[],
    links: IFlatLink[],
): Issue[] {
    const issues: Issue[] = [];
    for (const o of objects) {
        if (!normalize(o.name)) {
            issues.push({
                code: 'empty_name',
                severity: 'warning',
                message: `Объект #${o.id} без имени`,
                targets: [{ kind: 'object', id: o.id }],
            });
        }
    }
    for (const l of links) {
        if (!normalize(l.name)) {
            issues.push({
                code: 'empty_name',
                severity: 'warning',
                message: `Связь #${l.id} без имени`,
                targets: [{ kind: 'link', id: l.id }],
            });
        }
    }
    return issues;
}
