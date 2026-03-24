<script lang="ts">
    import { selectedStore } from "$lib/stores/objects.svelte";
    import type { ILink } from "$lib/interface";

    let {
        id,
        name,
        type,
        is,
        to
    } : ILink = $props();

    let data: string = $derived(`l + ${id}`);
    let selected: boolean = $derived(selectedStore.selected === data);
    let hover: boolean = $derived(selectedStore.hover === data);
    let dasharray: string = $derived(type === 'default' ? '0' : '8 8');

    let x1 = $derived(is.x + is.size / 2);
    let y1 = $derived(is.y + is.size / 2);
    let x2 = $derived(to.x + to.size / 2);
    let y2 = $derived(to.y + to.size / 2); 
    let r1 = $derived(is.size / 2);
    let r2 = $derived(to.size / 2);
    let size = $derived((is.size + to.size) / 2);

    // let selected: boolean = $derived(linkStore.link === id);
    let dx = $derived(x2 - x1);
    let dy = $derived(y2 - y1);
    let dist = $derived(Math.hypot(dx, dy)); // расстояние между центрами

    // Единичный вектор направления от первого центра ко второму
    const unitX = $derived(dx / dist);
    const unitY = $derived(dy / dist);

    // Точка на первом круге (от центра в сторону второго круга)
    let sx = $derived(x1 + unitX * r1);
    let sy = $derived(y1 + unitY * r1);
    let ex = $derived(x2 - unitX * r2);
    let ey = $derived(y2 - unitY * r2);
    let midX: number = $derived((sx + ex) / 2);
    let midY: number = $derived((sy + ey) / 2);
    function onclick() {
        selectedStore.set('selected', data);
    }
    function onmouseenter() {
        selectedStore.set('hover', data);
    }
    function onmouseleave() {
        selectedStore.clear('hover');
    }


</script>

<div>
    <svg class="absolute top-0 left-0 size-full">
        <line 
            {onmouseenter} 
            {onmouseleave} 
            {onclick} 
            x1={sx} 
            y1={sy} 
            x2={ex} 
            y2={ey} 
            stroke={`${selected || hover ? 'var(--color-accent)' : 'white'}`}
            stroke-width={3}
            stroke-dasharray={dasharray}
            stroke-linecap="round"
            />
    </svg>
    <span 
        {onmouseenter}
        {onmouseleave}
        {onclick} 
        style="left: {midX}px; top: {midY}px; font-size: {size / 7}px" 
        class={`${false ? 'text-accent' : 'text-border'} click absolute text-border z-3 -translate-1/2`}>
        {name}
    </span>
</div>