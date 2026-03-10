<script lang="ts">

    let {
        id,
        name,
        x = 300,
        y = 300,
        size = 100,
        onmousedown,
        onmouseup,
        linking
    } : {
        id: number;
        name: string;
        x: number;
        y: number;
        size: number;
        onmousedown: (event: MouseEvent, name: string) => void;
        onmouseup: (id: number) => void;
        linking: (event: MouseEvent, id: number) => void;
    } = $props();

    let font: number = $state(24);
    let ref: HTMLElement | undefined = $state(undefined);
    let hover: boolean = $state(false);

    function handleMouseDown(event: MouseEvent) {
        onmousedown(event, name, ref);
    }
    function handleLinking(event: MouseEvent) {
        linking(event, id);
    }
    function onmouseenter() {
        hover = true;
    }
    function onmouseleave() {
        hover = false;
    }
    function handleOnmouseup() {
        onmouseup(id);
    }
    
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div 
    bind:this={ref}
    style="top: {y}px; left: {x}px; width: {size}px; height: {size}px" 
    class="absolute flex flex-col"
    {onmouseenter}
    {onmouseleave}
    >
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="size-full relative">
        <p style="font-size: {size / 3}px" class="w-full z-5 text-center absolute bottom-full text-border">{name}</p>
        <div
            onmousedown={handleMouseDown}
            onmouseup={handleOnmouseup}
            class="border z-2 border-white rounded-full hover:border-accent size-full bg-black">
        </div>
        {#if hover}
            <div {onmouseenter} {onmouseleave} style="width: {size / 3}px; height: {size / 3}px" class="absolute flex items-center justify-between -translate-x-1/2 left-1/2 z-5 top-full bg-black">
                <button onmousedown={handleLinking} class="size-1/3 rounded-full bg-white hover:bg-accent"></button>
                <div class="size-1/3 rounded-full bg-white hover:bg-red"></div>
            </div>
        {/if}
    </div>
</div>