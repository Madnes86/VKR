import type { ICategory } from '$lib/interface';

/**
 * Поиск имеет два режима, которыми пользователь явно управляет:
 *
 * 1. Реактивная подсветка (applied=false): пользователь набирает запрос,
 *    matched-узлы подсвечиваются через LightText, остальные на месте.
 *    Это режим «найти, не отрезая контекст».
 *
 * 2. Фильтрация (applied=true): пользователь нажал кнопку поиска или
 *    Enter — список схлопывается до matched + их предков (чтобы дерево
 *    не разваливалось). Возврат к подсветке: ввести новый текст
 *    (apply сбросится) или нажать «крестик».
 */
class SearchStore {
	#data: string = $state('');
	#cats: Omit<ICategory, 'icon'>[] = $state([]);
	#applied: boolean = $state(false);

	set(v: string, cats: Omit<ICategory, 'icon'>[]) {
		// Любая правка строки — переход обратно в режим подсветки.
		// Иначе пользователь, набирая после применённого фильтра, не
		// увидит ни старых результатов, ни новых частичных совпадений.
		if (v !== this.#data) this.#applied = false;
		this.#data = v;
		this.#cats = cats;
	}
	get() {
		return this.#data;
	}
	get cats() {
		return this.#cats;
	}

	apply() {
		this.#applied = true;
	}
	get applied() {
		return this.#applied;
	}

	clear() {
		this.#data = '';
		this.#applied = false;
	}

	/**
	 * Активна ли категория для подсветки. Имена категорий передаются в
	 * #cats из Search.svelte (mocs/categoryes.ts: 'Objects', 'Links',
	 * 'optional', ...). Если ни одной категории не выбрано — подсветка
	 * работает по всем (нет фильтра); иначе — только по тем, что в
	 * #cats c check=true.
	 */
	matchesCategory(category: string): boolean {
		const checked = this.#cats.filter((c) => c.check);
		if (checked.length === 0) return true;
		return checked.some((c) => c.name === category);
	}
}

export const searchStore = new SearchStore();
