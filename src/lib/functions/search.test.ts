import { describe, expect, it } from 'vitest';
import type { IFlatObject, IFlatLink, ITreeObject } from '$lib/interface';
import { computeSearchVisibility, filterLinksByVisibility, pruneTree } from './search';

function obj(id: number, name: string, parent: number | null = null): IFlatObject {
	return { id, name, type: 'default', parent, content: null };
}
function lnk(id: number, is: number, to: number): IFlatLink {
	return { id, name: 'rel', type: 'default', is, to, isValue: false, toValue: true };
}
function tnode(
	id: number,
	name = `n${id}`,
	children: ITreeObject[] = [],
	links: IFlatLink[] = []
): ITreeObject {
	return {
		id,
		name,
		type: 'default',
		parent: null,
		x: 0,
		y: 0,
		size: 100,
		mass: 1,
		objects: children,
		links
	} as unknown as ITreeObject;
}

describe('computeSearchVisibility', () => {
	it('пустой запрос → пустой set', () => {
		const objects = [obj(1, 'foo'), obj(2, 'bar')];
		expect(computeSearchVisibility(objects, '').size).toBe(0);
		expect(computeSearchVisibility(objects, '   ').size).toBe(0);
	});

	it('подстрока: матч регистронезависимый', () => {
		const objects = [obj(1, 'Сервис'), obj(2, 'База'), obj(3, 'Пользователь')];
		const v = computeSearchVisibility(objects, 'СЕР');
		expect(v.has(1)).toBe(true);
		expect(v.size).toBe(1);
	});

	it('к матчу подтягиваются предки по parent', () => {
		// 1 → 2 → 3 (3 — лист). Ищем «лист» — должны увидеть 1, 2, 3.
		const objects = [obj(1, 'root'), obj(2, 'middle', 1), obj(3, 'лист', 2)];
		const v = computeSearchVisibility(objects, 'лист');
		expect([...v].sort()).toEqual([1, 2, 3]);
	});

	it('сиблинги матча НЕ попадают в visible', () => {
		const objects = [obj(1, 'root'), obj(2, 'foo', 1), obj(3, 'bar', 1)];
		const v = computeSearchVisibility(objects, 'foo');
		expect(v.has(1)).toBe(true); // предок
		expect(v.has(2)).toBe(true); // матч
		expect(v.has(3)).toBe(false); // сиблинг — не нужен
	});

	it('несколько матчей: все их предки собираются', () => {
		const objects = [
			obj(1, 'a-root'),
			obj(2, 'a-mid', 1),
			obj(3, 'foo', 2),
			obj(4, 'b-root'),
			obj(5, 'foo', 4)
		];
		const v = computeSearchVisibility(objects, 'foo');
		expect([...v].sort()).toEqual([1, 2, 3, 4, 5]);
	});

	it('повреждённый цикл в parent не валит обход', () => {
		// 1.parent=2, 2.parent=1 — DFS должен увидеть оба и остановиться.
		const objects = [obj(1, 'foo', 2), obj(2, 'bar', 1)];
		const v = computeSearchVisibility(objects, 'foo');
		// главное — что не зависли; 1 матч, 2 как предок добавится один раз
		expect(v.has(1)).toBe(true);
		expect(v.has(2)).toBe(true);
	});
});

describe('filterLinksByVisibility', () => {
	it('оставляет только те связи, у которых оба конца видимы', () => {
		const visible = new Set([1, 2]);
		const links = [
			lnk(10, 1, 2),
			lnk(11, 1, 3), // 3 невидим
			lnk(12, 4, 2) // 4 невидим
		];
		const out = filterLinksByVisibility(links, visible);
		expect(out.map((l) => l.id)).toEqual([10]);
	});

	it('пустой visible → пустой результат', () => {
		expect(filterLinksByVisibility([lnk(10, 1, 2)], new Set())).toEqual([]);
	});
});

describe('pruneTree', () => {
	it('удаляет невидимых детей рекурсивно', () => {
		const tree = tnode(0, 'root', [
			tnode(1, 'a', [tnode(11, 'a-1'), tnode(12, 'a-2')]),
			tnode(2, 'b')
		]);
		const visible = new Set([1, 11]); // только ветка 1.a → a-1
		const pruned = pruneTree(tree, visible);
		expect(pruned.objects.map((o) => o.id)).toEqual([1]);
		expect(pruned.objects[0].objects.map((o) => o.id)).toEqual([11]);
	});

	it('фильтрует links того уровня, на котором они привязаны', () => {
		const tree = tnode(0, 'root', [tnode(1), tnode(2), tnode(3)], [lnk(10, 1, 2), lnk(11, 1, 3)]);
		const visible = new Set([1, 2]);
		const pruned = pruneTree(tree, visible);
		expect(pruned.links.map((l) => l.id)).toEqual([10]);
		expect(pruned.objects.map((o) => o.id)).toEqual([1, 2]);
	});

	it('сохраняет корень даже если его id вне visible', () => {
		// Виртуальный root buildTree-а имеет id=0 и сам в visible не
		// попадает; pruneTree не должен его выбрасывать.
		const tree = tnode(0, 'root', [tnode(5, 'match')]);
		const visible = new Set([5]);
		const pruned = pruneTree(tree, visible);
		expect(pruned.id).toBe(0);
		expect(pruned.objects.map((o) => o.id)).toEqual([5]);
	});
});
