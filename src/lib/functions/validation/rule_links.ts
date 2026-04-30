/**
 * Правила, связанные с целостностью связей.
 *
 * self_link      — связь от объекта на самого себя. Семантически
 *                  бессмысленна; рендерер всё равно нарисует петлю,
 *                  но это почти всегда баг ввода. Severity: error.
 * dangling_link  — связь ссылается на объект, которого нет в списке
 *                  объектов (был удалён, или id переименовали).
 *                  Severity: error.
 */

import type { IFlatLink, IFlatObject } from '$lib/interface';
import type { Issue } from './types';

export function detectSelfLinks(links: IFlatLink[]): Issue[] {
	return links
		.filter((l) => l.is === l.to)
		.map<Issue>((l) => ({
			code: 'self_link',
			severity: 'error',
			message: `Связь #${l.id} «${l.name || '—'}» указывает сама на себя`,
			targets: [
				{ kind: 'link', id: l.id },
				{ kind: 'object', id: l.is }
			]
		}));
}

export function detectDanglingLinks(objects: IFlatObject[], links: IFlatLink[]): Issue[] {
	const ids = new Set(objects.map((o) => o.id));
	const issues: Issue[] = [];
	for (const l of links) {
		const missingFrom = !ids.has(l.is);
		const missingTo = !ids.has(l.to);
		if (!missingFrom && !missingTo) continue;
		const which =
			missingFrom && missingTo
				? 'оба конца'
				: missingFrom
					? `источник #${l.is}`
					: `получатель #${l.to}`;
		issues.push({
			code: 'dangling_link',
			severity: 'error',
			message: `Связь #${l.id} «${l.name || '—'}»: ${which} не существует`,
			targets: [{ kind: 'link', id: l.id }]
		});
	}
	return issues;
}
