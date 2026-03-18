<script lang="ts">
    import { linkStore } from "$lib/stores/objects.svelte";

    let {
        id,
        name,
        x1,
        y1,
        x2,
        y2,
        r1,
        r2
    } : {
        id: number;
        name: string;
        x1: number;
        y1: number;
        x2: number;
        y2: number;
        r1: number;
        r2: number;
    } = $props();
    $inspect(x1, y1);

    let selected: boolean = $derived(linkStore.link === id);
    let dx = $derived(x1 - x2);
    let dy = $derived(y1 - y2);
    let angle = $derived(Math.atan2(dx, dy));
    let sx = $derived(x1 - Math.cos(angle) * r1);
    let sy = $derived(y1 - Math.sin(angle) * r1);
    let ex = $derived(x2 + Math.cos(angle) * r2);
    let ey = $derived(y2 + Math.sin(angle) * r2);
    let midX: number = $derived((sx + sy) / 2);
    let midY: number = $derived((ex + ey) / 2);

    // $inspect(sx, sy);


    function onclick() {
        linkStore.set(id);
    }
    
</script>

<div>
    <svg class="absolute top-0 left-0 size-full">

        <line {onclick} x1={sx} y1={sy} x2={ex} y2={ey} stroke={`${selected ? 'var(--color-accent)' : 'white'}`} stroke-width={3} stroke-linecap="round"/>
    </svg>
    <span style="left: {midX}px; top: {midY}px" class="absolute text-border z-3 -translate-1/2">
        {name}
    </span>
</div>