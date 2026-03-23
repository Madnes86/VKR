import type { ICategory } from "$lib/interface";

class SearchStore {
    #data: string = $state('');
    #cats: Omit<ICategory, 'icon'>[] = $state([]);

    set(v: string, cats: Omit<ICategory, 'icon'>[]) {
        this.#data = v;
        this.#cats = cats;
    }
    get() { return this.#data }
    get cats() { return this.#cats }
}

export const searchStore = new SearchStore();