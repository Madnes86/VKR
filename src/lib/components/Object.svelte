<script lang="ts">
    import { Object, Link } from "$lib/components";
    import { physics } from "$lib/functions/physics";
    import { dragStore } from "$lib/stores/drag.svelte";  
    import { viewStore, selectedStore, type ITreeObject, type ILink } from "$lib/stores/objects.svelte";
    import { contextStore } from "$lib/stores/context.svelte";

    let {
        id,
        name,
        x = 300,
        y = 300,
        size = 100,
        objects = [],
        links = []
    } : {
        id: number;
        name: string;
        x: number;
        y: number;
        size: number;
        objects: ITreeObject[];
        links: ILink[];
    } = $props();

    let ref: HTMLElement | undefined = $state(undefined);
    let selected: boolean = $derived(selectedStore.selected == id);
    const centerX:  number = $derived(size / 2);
    const centerY:  number = $derived(size / 2);

    function onmousedown(e: MouseEvent) {
        if (!ref || e.button !== 0) return;
        e.stopPropagation();
        e.preventDefault();
        const offsetX = e.clientX - x;
        const offsetY = e.clientY - y;
        
        dragStore.setDrag({
            ref,
            id,
            offsetX,
            offsetY,
            startX: x,
            startY: y,
        });
        selectedStore.set(id);
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
    function loop() {
        if (!dragStore.hasValue()) physics(objects, centerX, centerY);
        requestAnimationFrame(loop);
    }
    loop();
    
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div 
    bind:this={ref}
    style="top: {y}px; left: {x}px; width: {size}px; height: {size}px; z-index: {id}" 
    class="absolute flex flex-col"
    {onmousemove}
    >
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="size-full relative">
        <p  style="font-size: {size / 3}px" class="click select-none w-full text-center absolute bottom-full text-border">{name}</p>
        <div
            {onmousedown}
            {ondblclick}
            {onmouseup}
            {oncontextmenu}
            style="border: {size / 100}px solid;"
            class={`${selected && 'border-accent!'} click-object border-white rounded-full size-full bg-black`}>
            {#each objects as {id, name, x, y, size, objects, links}, i}
                <Object {id} {name} {x} {y} {size} {objects} {links} />
            {/each}
            {#each links as l}
                {@const is = objects.find(o => o.id === l.is)}
                {@const to = objects.find(o => o.id === l.to)}

                {#if is && to}
                    <Link id={l.id} name={l.name} {is} {to} />
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
                <button style="border: {size / 100}px solid black;"
                    class="size-1/3 rounded-full bg-white hover:bg-red"></button>
            </div>
        {/if}
    </div>
</div>