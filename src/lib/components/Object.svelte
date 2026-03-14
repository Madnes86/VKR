<script lang="ts">
    import { Object } from "$lib/components";
    import { physics } from "$lib/functions/physics";
    import { dragStore } from "$lib/stores/drag.svelte";  

    let {
        id,
        name,
        x = 300,
        y = 300,
        size = 100,
        linking,
        objects = []
    } : {
        id: number;
        name: string;
        x: number;
        y: number;
        size: number;
        linking: (event: MouseEvent, id: number) => void;
        objects: any[];
    } = $props();

    let ref: HTMLElement | undefined = $state(undefined);
    let hover: boolean = $state(false);
    let centerX: number = $derived(size / 2);
    let centerY: number = $derived(size / 2);

    const onmouseenter = () => hover = true;
    const onmouseleave = () => hover = false;

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
    }
    function handleLinking(event: MouseEvent) {
        linking(event, id);
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
    function onmouseup() {
        if (dragStore.hasValue()) {
            dragStore.clearDrag();
        }
    }
    function loop() {
        if (!dragStore.hasValue()) {
            physics(objects, centerX, centerY);
        }
        requestAnimationFrame(loop);
    }
    loop();
    
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div 
    bind:this={ref}
    style="top: {y}px; left: {x}px; width: {size}px; height: {size}px; z-index: {id}" 
    class="absolute flex flex-col"
    {onmouseenter}
    {onmouseleave}
    {onmousemove}
    >
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="size-full relative">
        <p  style="font-size: {size / 3}px" class="select-none w-full text-center absolute bottom-full text-border">{name}</p>
        <div
            {onmousedown}
            {onmouseup}
            class={`${hover && 'border-accent!'} border border-white rounded-full size-full bg-black`}>
            {#each objects as {id, name, x, y, size, objects}, i}
                <Object {id} {name} {x} {y} {size} {objects} {linking}/>
            {/each}  
        </div>
        {#if hover}
            <div {onmouseenter} {onmouseleave} style="width: {size / 3}px; height: {size / 3}px" class="absolute flex items-center justify-between -translate-x-1/2 left-1/2 z-5 top-full bg-black">
                <button onmousedown={handleLinking} class="size-1/3 rounded-full bg-white hover:bg-accent"></button>
                <div class="size-1/3 rounded-full bg-white hover:bg-red"></div>
            </div>
        {/if}
    </div>
</div>