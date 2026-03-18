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
    // $inspect(x1, y1);

    let selected: boolean = $derived(linkStore.link === id);
    let dx = $derived(x2 - x1);
    let dy = $derived(y2 - y1);
    let test = $derived(dx / dy);
    // $inspect( dy);
    // x1 > x2 x1 - x2

    let angle = $derived(Math.atan(test));
    // $inspect(angle);
    // let sx = $derived(x1 + Math.cos(angle) * r1);
    // let sy = $derived(y1 + Math.sin(angle) * r1);
    // let ex = $derived(x2 - Math.cos(angle) * r2);
    // let ey = $derived(y2 - Math.sin(angle) * r2);
    const dist = Math.hypot(dx, dy); // расстояние между центрами

//   if (dist === 0) {
//     return {
//       start: { x: x1, y: y1 - r1 },
//       end:   { x: x2, y: y2 - r2 }
//     };
//   }

    // Единичный вектор направления от первого центра ко второму
    const unitX = $derived(dx / dist);
    const unitY = $derived(dy / dist);

    // Точка на первом круге (от центра в сторону второго круга)
    let sx = $derived(x1 + unitX * r1);
    let sy = $derived(y1 + unitY * r1);
    let ex = $derived(x2 - unitX * r2);
    let ey = $derived(y2 - unitY * r2);
    // const start = {
    // x: x1 + unitX * r1,
    // y: y1 + unitY * r1
    // };

    // // Точка на втором круге (от центра в сторону первого круга)
    // const end = {
    // x: x2 - unitX * r2,
    // y: y2 - unitY * r2
    // };
    let midX: number = $derived((sx + ex) / 2);
    let midY: number = $derived((sy + ey) / 2);
    function onclick() {
        linkStore.set(id);
    }

</script>

<div>
    <svg class="absolute top-0 left-0 size-full -10">
        <!-- <line {onclick} {x1} {y1} {x2} {y2} stroke={`${selected ? 'var(--color-accent)' : 'white'}`} stroke-width={3} stroke-linecap="round"/> -->
        <line {onclick} x1={sx} y1={sy} x2={ex} y2={ey} stroke={`${selected ? 'var(--color-accent)' : 'white'}`} stroke-width={3} stroke-linecap="round"/>
    </svg>
    <span style="left: {midX}px; top: {midY}px" class="absolute text-border z-3 -translate-1/2">
        {name}
    </span>
</div>