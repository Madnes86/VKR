/**
 * Композиция всех правил валидации диаграммы.
 *
 * Правила реализованы как чистые функции, чтобы каждое можно было
 * тестировать в изоляции. validate() просто вызывает их по очереди и
 * возвращает плоский список Issue.
 */

import type { IFlatLink, IFlatObject } from '$lib/interface';
import { detectLinkCycles, detectParentCycles } from './rule_cycles';
import { detectDanglingLinks, detectSelfLinks } from './rule_links';
import { detectDuplicateNames, detectEmptyNames } from './rule_names';
import type { Issue } from './types';

export type { Issue, IssueCode, IssueTarget, Severity } from './types';

export function validate(objects: IFlatObject[], links: IFlatLink[]): Issue[] {
	return [
		...detectParentCycles(objects),
		...detectSelfLinks(links),
		...detectDanglingLinks(objects, links),
		...detectLinkCycles(objects, links),
		...detectDuplicateNames(objects),
		...detectEmptyNames(objects, links)
	];
}
