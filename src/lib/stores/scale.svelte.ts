import { writable } from "svelte/store";

let scale = $state(1);

export const scaleStore = {
    get value() { return scale },
    set value(v: number) { scale = Math.max(0.5, Math.min(3, v)) },
    zoomIn:  () => scale = Math.min(3, scale * 1.1),
    zoomOut: () => scale = Math.max(0.5, scale / 1.1)
}