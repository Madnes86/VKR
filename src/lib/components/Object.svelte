<script lang="ts">

    let {
        id,
        name,
        x = 300,
        y = 300,
        size = 100,
        onmousedown,
        onmouseup,
    } : {
        id: number;
        name: string;
        x: number;
        y: number;
        size: number;
        onmousedown: (event: MouseEvent, name: string) => void;
        onmouseup: () => void;
    } = $props();

    let font: number = $state(24);
    let ref: HTMLElement | undefined = $state(undefined);

    function handleMouseDown(event: MouseEvent) {
        onmousedown(event, name, ref);
    }
    
</script>

<div 
    bind:this={ref}
    style="top: {y}px; left: {x}px; width: {size}px; height: {size}px" 
    class="absolute flex flex-col"
    >
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
        onmousedown={handleMouseDown}
        {onmouseup}
        class="border z-2 border-white rounded-full hover:border-accent size-full relative bg-black">
        <p class="w-full text-center absolute bottom-full text-border">{name}</p>
    </div>
</div>