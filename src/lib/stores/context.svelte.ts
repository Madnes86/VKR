import { writable } from "svelte/store";

class ContextStore {
    data: { x: number, y: number, id: number } | null = $state(null);

    get isOpen() { return this.data !== null }
    get x() {return this.data?.x ?? 0 }
    get y() {return this.data?.y ?? 0}
    set(e: MouseEvent, id: number) {
        e.preventDefault();
        e.stopPropagation();
        this.data = {x: e.clientX, y: e.clientY, id};
    }
    close() {
        this.data = null;
    }
}
export const contextStore = new ContextStore();