
class Side {
    #d = $state([
        { pos: 'l', width: 300, main: true },
        { pos: 'r', width: 300, main: false}
    ]);
    i = $state(null);

    get v() { return this.#d }
    update(key: 'pos' | 'width' | 'main', v: never, i: number) {
        this.#d[i][key] = v;
    }
    add(e: { pos: 'l' | 'r', width: number, main: boolean}, i: number) {
        this.#d.push(e);
        this.i = i; 
        if (this.#d.length > 2) {
            this.#d.shift();
        }
    }
    main() { return this.#d.find(e => e.main) }
    remove() { 
        const i = this.#d.findIndex(e => !e.main) 
        if (i !== -1) {
            this.#d.splice(i, 1);
            this.i = null;
        }
    }
}
export const side = new Side();