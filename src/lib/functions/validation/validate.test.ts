import { describe, expect, it } from 'vitest';
import type { IFlatLink, IFlatObject } from '$lib/interface';
import { validate } from './index';
import { detectLinkCycles, detectParentCycles } from './rule_cycles';
import { detectDanglingLinks, detectSelfLinks } from './rule_links';
import { detectDuplicateNames, detectEmptyNames } from './rule_names';

function obj(id: number, name = 'X', parent: number | null = null): IFlatObject {
	return { id, name, type: 'default', parent, content: null };
}
function lnk(id: number, is: number, to: number, name = 'rel'): IFlatLink {
	return { id, name, type: 'default', is, to, isValue: false, toValue: true };
}

describe('detectParentCycles', () => {
	it('возвращает [] для здорового дерева', () => {
		const objects = [obj(1, 'a'), obj(2, 'b', 1), obj(3, 'c', 1)];
		expect(detectParentCycles(objects)).toEqual([]);
	});

	it('ловит прямой цикл A→B→A', () => {
		const objects = [obj(1, 'a', 2), obj(2, 'b', 1)];
		const issues = detectParentCycles(objects);
		expect(issues).toHaveLength(1);
		expect(issues[0].severity).toBe('error');
		expect(issues[0].targets.map((t) => t.id).sort()).toEqual([1, 2]);
	});

	it('ловит цикл длиннее (A→B→C→A)', () => {
		const objects = [obj(1, 'a', 3), obj(2, 'b', 1), obj(3, 'c', 2)];
		const issues = detectParentCycles(objects);
		expect(issues).toHaveLength(1);
	});

	it('самозамыкание объекта на самого себя в parent', () => {
		const objects = [obj(1, 'a', 1)];
		const issues = detectParentCycles(objects);
		expect(issues).toHaveLength(1);
		expect(issues[0].targets[0].id).toBe(1);
	});
});

describe('detectLinkCycles', () => {
	it('здоровый ациклический граф — без issue', () => {
		const objects = [obj(1), obj(2), obj(3)];
		const links = [lnk(10, 1, 2), lnk(11, 2, 3)];
		expect(detectLinkCycles(objects, links)).toEqual([]);
	});

	it('ловит цикл a→b→a', () => {
		const objects = [obj(1), obj(2)];
		const links = [lnk(10, 1, 2), lnk(11, 2, 1)];
		const issues = detectLinkCycles(objects, links);
		expect(issues).toHaveLength(1);
		expect(issues[0].severity).toBe('warning');
		// объекты + связи в targets
		const objIds = issues[0].targets
			.filter((t) => t.kind === 'object')
			.map((t) => t.id)
			.sort();
		expect(objIds).toEqual([1, 2]);
		const linkIds = issues[0].targets
			.filter((t) => t.kind === 'link')
			.map((t) => t.id)
			.sort();
		expect(linkIds).toEqual([10, 11]);
	});

	it('игнорирует self-link (его ловит rule_links)', () => {
		const objects = [obj(1)];
		const links = [lnk(10, 1, 1)];
		expect(detectLinkCycles(objects, links)).toEqual([]);
	});

	it('одинаковый цикл не дублируется при разных стартах DFS', () => {
		const objects = [obj(1), obj(2), obj(3)];
		const links = [lnk(10, 1, 2), lnk(11, 2, 3), lnk(12, 3, 1)];
		const issues = detectLinkCycles(objects, links);
		expect(issues).toHaveLength(1);
	});
});

describe('detectSelfLinks', () => {
	it('ловит is === to', () => {
		const links = [lnk(10, 5, 5, 'self')];
		const issues = detectSelfLinks(links);
		expect(issues).toHaveLength(1);
		expect(issues[0].severity).toBe('error');
	});

	it('пропускает обычные связи', () => {
		expect(detectSelfLinks([lnk(10, 1, 2)])).toEqual([]);
	});
});

describe('detectDanglingLinks', () => {
	it('ловит связь на удалённый объект', () => {
		const objects = [obj(1)];
		const links = [lnk(10, 1, 99)]; // 99 не существует
		const issues = detectDanglingLinks(objects, links);
		expect(issues).toHaveLength(1);
		expect(issues[0].severity).toBe('error');
	});

	it('оба конца отсутствуют — одна issue с понятным сообщением', () => {
		const issues = detectDanglingLinks([], [lnk(10, 1, 2)]);
		expect(issues).toHaveLength(1);
		expect(issues[0].message).toContain('оба конца');
	});

	it('целая связь не репортится', () => {
		const objects = [obj(1), obj(2)];
		expect(detectDanglingLinks(objects, [lnk(10, 1, 2)])).toEqual([]);
	});
});

describe('detectDuplicateNames', () => {
	it('ловит двух «foo» под одним родителем', () => {
		const objects = [
			obj(1, 'parent'),
			obj(2, 'foo', 1),
			obj(3, 'FOO', 1), // case-insensitive
			obj(4, 'bar', 1)
		];
		const issues = detectDuplicateNames(objects);
		expect(issues).toHaveLength(1);
		expect(issues[0].targets.map((t) => t.id).sort()).toEqual([2, 3]);
	});

	it('одинаковые имена под РАЗНЫМИ родителями — допустимо', () => {
		const objects = [obj(1, 'foo', 10), obj(2, 'foo', 20)];
		expect(detectDuplicateNames(objects)).toEqual([]);
	});

	it('пробелы в именах нормализуются', () => {
		const objects = [obj(1, 'a'), obj(2, '  a  ')];
		expect(detectDuplicateNames(objects)).toHaveLength(1);
	});

	it('пустые имена не учитываются (другое правило)', () => {
		const objects = [obj(1, ''), obj(2, '   ')];
		expect(detectDuplicateNames(objects)).toEqual([]);
	});
});

describe('detectEmptyNames', () => {
	it('ловит объект без имени', () => {
		const issues = detectEmptyNames([obj(1, '')], []);
		expect(issues).toHaveLength(1);
		expect(issues[0].severity).toBe('warning');
	});

	it('ловит связь без имени', () => {
		const issues = detectEmptyNames([], [lnk(10, 1, 2, '')]);
		expect(issues).toHaveLength(1);
		expect(issues[0].targets[0].kind).toBe('link');
	});

	it('пробельное имя — тоже пустое', () => {
		const issues = detectEmptyNames([obj(1, '   ')], []);
		expect(issues).toHaveLength(1);
	});
});

describe('validate (композиция)', () => {
	it('здоровая диаграмма не даёт issue', () => {
		const objects = [obj(1, 'a'), obj(2, 'b', 1)];
		const links = [lnk(10, 1, 2, 'rel')];
		expect(validate(objects, links)).toEqual([]);
	});

	it('несколько правил срабатывают одновременно — собираются в один список', () => {
		const objects = [
			obj(1, ''), // empty_name
			obj(2, 'foo', 1),
			obj(3, 'foo', 1) // duplicate_name
		];
		const links = [
			lnk(10, 1, 1, 'self'), // self_link
			lnk(11, 1, 99, 'gone') // dangling_link
		];
		const issues = validate(objects, links);
		const codes = new Set(issues.map((i) => i.code));
		expect(codes.has('empty_name')).toBe(true);
		expect(codes.has('duplicate_name')).toBe(true);
		expect(codes.has('self_link')).toBe(true);
		expect(codes.has('dangling_link')).toBe(true);
	});

	it('error и warning сосуществуют в одном проходе', () => {
		const objects = [obj(1, 'a', 2), obj(2, 'b', 1)]; // parent cycle (error)
		const links = [lnk(10, 1, 2), lnk(11, 2, 1)]; // link cycle (warning)
		const issues = validate(objects, links);
		const severities = new Set(issues.map((i) => i.severity));
		expect(severities.has('error')).toBe(true);
		expect(severities.has('warning')).toBe(true);
	});
});
