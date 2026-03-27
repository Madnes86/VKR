
class Side {
    #d = $state([
        { pos: 'l', width: 300, main: true },
        { pos: 'r', width: 300, main: false}
    ]);

    get v() { return this.#d }
    set v(d: any[]) { this.#d = d }
}
export const side = new Side();