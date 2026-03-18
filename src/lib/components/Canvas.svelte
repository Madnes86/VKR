<script lang="ts">
    import { Object, Link } from "$lib/components";
    import { objectsStore, type IFlatObject, type ITreeObject } from "$lib/stores/objects.svelte";
    import { scaleStore } from "$lib/stores/scale.svelte";
    import { linksStore } from "$lib/stores/links.svelte";
    import { dragStore } from "$lib/stores/drag.svelte";
    import { physics, resizeObjects } from "$lib/functions/physics";

    let center: boolean = $state(true);
    let width: number = $state(0);
    let height: number = $state(0);
    let centerX: number = $derived(width  / 2);
    let centerY: number = $derived(height / 2);
    let object: ITreeObject | null = $state(null);
    objectsStore.subscribe(v => object = v);

    function onwheel(event: WheelEvent) {
        scaleStore.value = event.deltaY > 0 ? scaleStore.value -= 1.01 : scaleStore.value += 1.01;
        scaleStore.value = Math.max(0.5, Math.min(3, scaleStore.value));
        resizeObjects(object?.objects, scaleStore.value);
    }
    function onmousemove(event: MouseEvent) { // ?
        const dragObj = dragStore.getValue();
        
        if (dragObj) {
            const obj = object?.objects.find(o => o.id === dragObj.id);

            if (!obj) return;
            obj.x = event.clientX - dragObj.offsetX;
            obj.y = event.clientY - dragObj.offsetY;
        }
    }

    function loop() {
        if (!dragStore.hasValue()) {
            physics(object?.objects, centerX, centerY, center);
        }
        requestAnimationFrame(loop);
    }
    resizeObjects(object?.objects, scaleStore.value);
    loop();
</script>

<svelte:window {onmousemove} {onwheel} bind:innerWidth={width} bind:innerHeight={height} />

<div class="fixed top-0 left-0 size-full z-0">
    {#each object?.objects as {id, name, x, y, size, objects}, i}
        <Object {id} {name} {x} {y} {size} {objects} />
    {/each}
    <!-- {#each objects as {id, name, x, y, size, objects}, i} -->
    <!-- <Object 
        id={object.id}
        name={object.name}
        x={object.x}
        y={object.y}
        size={object.size}
        objects={object.objects}
    /> -->
        <!-- <Object {id} {name} {x} {y} {size} {objects} /> -->
    <!-- {/each} -->
    <!-- {#each sortLink as {id, name, x1, y1, x2, y2}}
        <Link {id} {name} {x1} {y1} {x2} {y2} />
    {/each} -->
</div>