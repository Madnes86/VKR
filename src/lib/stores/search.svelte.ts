

class SearchStore {
    #data: string = $state('');
    #global: boolean = $state(true);

    set(v: string, global: boolean = true) {
        this.#data = v;
        this.#global = global;
    }
    get() { return this.#data }
    get isGlobal() { return this.#global }
}

export const searchStore = new SearchStore();