/**
 * Типы для валидатора диаграммы.
 *
 * Issue несёт серьёзность + список целей. Объект/связь могут попадать
 * в несколько issue одновременно — финальный цвет вычисляется в
 * validationStore по правилу error > warning > none.
 */

export type Severity = 'error' | 'warning';

export type IssueCode =
	| 'cycle_links' // направленный цикл в графе связей
	| 'cycle_parents' // цикл в parent-цепочке
	| 'self_link' // is === to
	| 'dangling_link' // is или to указывают на удалённый объект
	| 'duplicate_name' // несколько детей одного родителя имеют одно имя
	| 'empty_name'; // пустое или пробельное имя у объекта/связи

export interface IssueTarget {
	kind: 'object' | 'link';
	id: number;
}

export interface Issue {
	code: IssueCode;
	severity: Severity;
	message: string;
	targets: IssueTarget[];
}
