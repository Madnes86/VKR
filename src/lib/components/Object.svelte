<script lang="ts">
	import Flex from "./Flex.svelte";

    let {
        name,
    } : {
        name: string;
    } = $props();

    let offsetX: number = 0;
    let offsetY: number = 0;
    let size: number = $state(100);
    let font: number = $state(24);
    let x: number = $state(300);
    let y: number = $state(300);
    let isDrag: boolean = $state(false);
    let object: HTMLElement | undefined = $state(undefined);
    const F: number = 0.05;

    let centerX: number = window.innerWidth / 2 - 100 / 2;
    let centerY: number = window.innerHeight / 2 - 100 / 2;

    function onmousedown(event: MouseEvent) {
        isDrag = !isDrag;
        const rect = object?.getBoundingClientRect();
        offsetX = event.clientX - rect?.left;
        offsetY = event.clientY - rect?.top
    }
    function onmousemove(event: MouseEvent) {
        if (isDrag) {
            x = event.clientX - offsetX;
            y = event.clientY - offsetY;
        }
    }
    function onmouseup() {
        isDrag = false;
        attract();
    }
    function attract() {
         if (!isDrag) {
            const dx = centerX - x;
            const dy = centerY - y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > 1) {
                const strength = Math.min(F * (dist / 200), 0.1);
                
                x += dx * strength;
                y += dy * strength;
                requestAnimationFrame(attract);
            } else {
                x = centerX;
                y = centerY;
            }
        }
    }
</script>

<svelte:window {onmousemove} />

<div 
    bind:this={object}
    style="top: {y}px; left: {x}px; width: {size}px; height: {size + font}px" 
    class="absolute flex flex-col size-12"
    >
    <p class="w-full text-center">{name}</p>
    <div
        {onmousedown}
        {onmouseup}
        class="border border-white rounded-full hover:border-accent size-full"></div>
</div>