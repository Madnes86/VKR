<script lang="ts">
    import { Object, Link, Name } from "$lib/components";
    import { runPhysicsLoop } from "$lib/functions/physics";
    import { appearanceStore } from "$lib/stores/appearance.svelte";
    import { dragStore } from "$lib/stores/drag.svelte";
    import { viewStore, selectedStore } from "$lib/stores/objects.svelte";
    import { contextStore } from "$lib/stores/context.svelte";
    import { validationStore } from "$lib/stores/validation.svelte";
    import type { ITreeObject } from "$lib/interface";

    let {
        id,
        name,
        type = 'default',
        x = 300,
        y = 300,
        size = 100,
        objects = [],
        links = [],
        selParent,
        noArrows = false
    } : ITreeObject & { noArrows?: boolean } = $props();

    let ref: HTMLElement | undefined = $state(undefined);
    let data = $derived(`o + ${id}`);
    let selected: boolean = $derived(selectedStore.selected === data);
    let hover: boolean = $derived(selectedStore.hover === data);
    let validationColor: string = $derived.by(() => {
        const sev = validationStore.severityForObject(id);
        if (sev === 'error')   return 'var(--color-red)';
        if (sev === 'warning') return 'var(--color-yellow)';
        return 'white';
    });
    const centerX:  number = $derived(size / 2);
    const centerY:  number = $derived(size / 2);
    const border:   string = $derived(type === 'default' ? 'solid' : 'dashed');

    function onmousedown(e: MouseEvent) {
        if (!ref || e.button !== 0) return;
        e.stopPropagation();
        e.preventDefault();
        
        dragStore.setDrag({
            ref,
            id,
            offsetX: e.clientX - x,
            offsetY: e.clientY - y,
            startX: x,
            startY: y,
        });
        selectedStore.set("selected", data);
        if (selected) selectedStore.clear("hover");
    }
    function onmousemove(event: MouseEvent) {
        const dragObj = dragStore.getValue();
        
        if (dragObj) {
            const obj = objects.find(o => o.id === dragObj.id);

            if (!obj) return;
            obj.x = event.clientX - dragObj.offsetX;
            obj.y = event.clientY - dragObj.offsetY;
        }
    }
    function onmouseover(e: MouseEvent) {
        e.stopPropagation();
        selectedStore.set('hover', data);
    }
    function onmouseleave(e: MouseEvent) {
        e.stopPropagation();
        selectedStore.clear('hover');
    }
    function ondblclick(e: MouseEvent) {
        e.stopPropagation();
        viewStore.set(id);
    }
    function onmouseup() {
        if (dragStore.hasValue()) dragStore.clearDrag();
    }
    function oncontextmenu(e: MouseEvent) {
        e.preventDefault();
        e.stopPropagation();
        contextStore.set(e, id);
    }
    $effect(() => {
        if (objects.length === 0) return;
        return runPhysicsLoop({
            getObjects: () => objects,
            getLinks: () => links,
            getCenter: () => ({ x: centerX, y: centerY }),
            isPaused: () => dragStore.hasValue(),
            onWakeSignal: (wake) => dragStore.subscribe(() => wake()),
        });
    });

</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div 
    bind:this={ref}
    style="top: {y}px; left: {x}px; width: {size}px; height: {size}px; z-index: {id}" 
    class="absolute flex flex-col"
    {onmousemove}
    >
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <!-- TODO: размеры ввода большие -->
    <div class="size-full relative">
        <Name {name} {size} />
        <!-- svelte-ignore a11y_mouse_events_have_key_events -->
        <div
            {onmousedown}
            {ondblclick}
            {onmouseup}
            {oncontextmenu}
            {onmouseover}
            {onmouseleave}
            style="border: {size / 100}px {border} {selParent ? 'black' : validationColor}; outline: {size / 100}px {border} black; transition-duration: {size}ms"
            class={`${selected && 'bg-accent! border-none!'} ${hover && 'outline-accent! border-0!'} transition-all rounded-full size-full bg-black`}>
            {#each objects as {id, name, type, x, y, size, objects, links}, i}
                {#if appearanceStore.has(id)}
                    <Object {id} {name} {type} {x} {y} {size} {objects} {links} {noArrows} selParent={selected ? true : false} />
                {/if}
            {/each}
            {#each links as l}
                {@const self = { x: 0, y: 0, size }}
                {@const is = l.is === id ? self : objects.find(o => o.id === l.is)}
                {@const to = l.to === id ? self : objects.find(o => o.id === l.to)}

                {#if is && to && (l.is === id || appearanceStore.has(l.is)) && (l.to === id || appearanceStore.has(l.to))}
                    <Link
                        id={l.id}
                        name={l.name}
                        type={l.type}
                        {is}
                        {to}
                        isValue={noArrows ? false : (l.isValue ?? false)}
                        toValue={noArrows ? false : (l.toValue ?? true)}
                    />
                {/if}
            {/each}
        </div>
        {#if selected}
            <div 
                style="width: {size / 3}px; height: {size / 3}px" 
                class="absolute flex items-center justify-between -translate-x-1/2 left-1/2 z-5 top-full rounded-full bg-"
                >
                <button 
                    style="border: {size / 100}px solid black;"
                    class="size-1/3 rounded-full bg-white hover:bg-accent"></button>
                <button 
                    style="border: {size / 100}px solid black;"
                    class="size-1/3 rounded-full bg-white hover:bg-red"></button>
            </div>
        {/if}
    </div>
</div>