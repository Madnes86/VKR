<script lang="ts">

    let {
        name,
        x = 300,
        y = 300,
        size = 100,
        onmousedown,
        onmouseup,
    } : {
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
    style="top: {y}px; left: {x}px; width: {size}px; height: {size + font}px" 
    class="absolute flex flex-col size-12"
    >
    <p class="w-full text-center">{name}</p>
    <div
        onmousedown={handleMouseDown}
        {onmouseup}
        class="border border-white rounded-full hover:border-accent size-full"></div>
</div>