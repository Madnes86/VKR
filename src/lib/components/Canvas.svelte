<script lang="ts">
    import { Object, Link } from "$lib/components";
    import { objectsStore, type ObjectType } from "$lib/stores/objects";
    import { scaleStore } from "$lib/stores/scale.svelte";
    import { linksStore } from "$lib/stores/links.svelte";
    import { dragStore } from "$lib/stores/drag.svelte";
    import { physics, resizeObjects } from "$lib/functions/physics";

    let center: boolean = $state(true);
    let width: number = $state(0);
    let height: number = $state(0);
    let centerX: number = $derived(width  / 2);
    let centerY: number = $derived(height / 2);
    const SIZE: number = 100;

    let objects: {id: number, name: string, x: number, y: number, size: number, mass: number, parent: number | null}[] = $state([]);
    objectsStore.subscribe(v => objects = [...v]);
    console.log(objects)
    let links: {id: number, name: string, objects: {is: number, to: number}[]}[] = [];
    linksStore.subscribe(v => links = [...v]);
    let sortLink = $derived(
        links.map(link => {
            const fromObj = objects.find(o => o.id === link.objects[0]?.is);
            const toObj = objects.find(o => o.id === link.objects[0]?.to);
            
            if (fromObj && toObj) {
                return {
                    id: link.id,
                    name: link.name,
                    x1: fromObj.x + fromObj.size / 2,
                    y1: fromObj.y + fromObj.size / 2,
                    x2: toObj.x + toObj.size / 2,
                    y2: toObj.y + toObj.size / 2
                };
            }
            return null;
        }).filter(Boolean) // Убираем null
    );

    const toggle = () => center = !center
    function onwheel(event: WheelEvent) {
        scaleStore.value = event.deltaY > 0 ? scaleStore.value -= 1.01 : scaleStore.value += 1.01;
        scaleStore.value = Math.max(0.5, Math.min(3, scaleStore.value));
        resizeObjects(objects, scaleStore.value);
    }
    function onmousemove(event: MouseEvent) { // ?
        const dragObj = dragStore.getValue();
        
        if (dragObj) {
            const obj = objects.find(o => o.id === dragObj.id);

            if (!obj) return;
            obj.x = event.clientX - dragObj.offsetX;
            obj.y = event.clientY - dragObj.offsetY;
        }
    }
    
    let targetObj = $state(0);
    function linking(e: MouseEvent, id: number) {
        targetObj = id;
    }
    function onmouseup(id: number) {
        if (dragStore.hasValue()) {
            dragStore.clearDrag();
        } 
        if (targetObj > 0) {
            linksStore.addLink({id: 20, name: 'test', objects: [{is: targetObj, to: id}]});
            targetObj = 0;
        }
    }
    function create(e: MouseEvent) {
        if (dragStore.hasValue()) {
            // dragStore.clearDrag();
        } else {
            const x = e.clientX - SIZE / 2;
            const y = e.clientY - SIZE / 2;
            const name = (objects.length + 1).toString();
            const newObj: ObjectType = {
                id: Math.floor(Math.random() * Math.pow(10, 4)),
                name: name, 
                x: x, 
                y: y, 
                size: SIZE,
                mass: 2,
                parent: 0
            };
            objectsStore.addObject(newObj);
            // objects.push(newObj);
            // objectsStore.updateAll(objects);
            resizeObjects(objects, scaleStore.value);
        }
    }
    function loop() {
        if (!dragStore.hasValue()) {
            physics(objects, centerX, centerY, center);
        }
        requestAnimationFrame(loop);
    }
    resizeObjects(objects, scaleStore.value);
    loop();
</script>

<svelte:window {onmousemove} {onwheel} bind:innerWidth={width} bind:innerHeight={height} />

<button onclick={toggle} class="absolute z-10 right-0 p-2 click bg-accent">
    centering
</button>

<div class="fixed top-0 left-0 size-full z-0" onclick={(e) => create(e)}>
    {#each objects as {id, name, x, y, size, objects}, i}
        <Object {id} {name} {x} {y} {size} {objects} {linking}/>
    {/each}
    {#each sortLink as {id, name, x1, y1, x2, y2}}
        <Link {id} {name} {x1} {y1} {x2} {y2} />
    {/each}
</div>