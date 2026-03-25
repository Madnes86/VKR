
class Width {
    #d = $state(350);

    get v() { return this.#d }
    set v(d: number) { this.#d = d }
}
export const sideWidth = new Width();