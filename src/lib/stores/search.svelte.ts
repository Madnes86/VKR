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
}

export const searchStore = new SearchStore();
