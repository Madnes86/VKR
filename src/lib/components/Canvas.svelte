<script lang="ts">
    import { Object } from "$lib/components";
    import { objectsStore } from "$lib/stores/objects";

    let object: HTMLElement | null = $state(null);
    let offsetX: number = 0;
    let offsetY: number = 0;
    let drag: string | null = $state(null);

    let objects: {name: string, x: number, y: number, size: number, mass: number}[] = $state([]);
    objectsStore.subscribe(v => objects = [...v]);
    let centerX: number = window.innerWidth / 2;
    let centerY: number = window.innerHeight / 2;
    let scale: number = $state(1);
    let animationFrame: number | null = $state(null);
    const SIZE: number = 100;
    const MIN_SCALE: number = 0.5;
    const MAX_SCALE: number = 3;
    const F: number = 0.05;
    const F_REPULSION: number = 0.1;



    function onwheel(event: WheelEvent) {
        scale = event.deltaY > 0 ? scale -= 1.01 : scale += 1.01;
        scale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale));
        updateObjects();
    }
    function updateObjects() {
        objects.forEach(e => e.size = SIZE * (e.mass * 0.1) * scale);
    }

    function onmousedown(event: MouseEvent, name: string, ref: HTMLElement) {
        drag = name;
        object = ref;
        const rect = object?.getBoundingClientRect();
        offsetX = event.clientX - rect?.left;
        offsetY = event.clientY - rect?.top
    }
    function onmousemove(event: MouseEvent) {
        objects.forEach(e => {
            if (e.name === drag) {
                e.x = event.clientX - offsetX;
                e.y = event.clientY - offsetY;
            }
        });
        // collisions();
    }
    function onmouseup() {
        drag = null;
        attract();
    }
    function collisions() {
        for (let i = 0; i < objects.length; i++) {
            for (let j = i + 1; j < objects.length; j++) {
                const obj1 = objects[i];
                const obj2 = objects[j];

                const x1 = obj1.x + obj1.size / 2;
                const y1 = obj1.y + obj1.size / 2;
                const x2 = obj2.x + obj2.size / 2;
                const y2 = obj2.y + obj2.size / 2;
                
                const dx = x1 - x2;
                const dy = y1 - y2;
                const dist = Math.sqrt(dx * dx + dy * dy);

                const minDist = (obj1.size + obj2.size) / 2;
                const repulsion = minDist * F_REPULSION;

                if (dist < minDist + repulsion) {
                    const overlap = 100 + F_REPULSION;
                    const angle = Math.atan2(dy, dx);
                    
                    if (obj1.name !== drag && obj2.name !== drag) {
                        // Оба не перетаскиваются - мутируем оба
                        obj1.x -= Math.cos(angle) * overlap;
                        obj1.y -= Math.sin(angle) * overlap;
                        obj2.x += Math.cos(angle) * overlap;
                        obj2.y += Math.sin(angle) * overlap;
                    } else if (obj1.name === drag) {
                        // Тянем obj1 - мутируем только obj2
                        obj2.x += Math.cos(angle) * overlap * 2;
                        obj2.y += Math.sin(angle) * overlap * 2;
                    } else if (obj2.name === drag) {
                        // Тянем obj2 - мутируем только obj1
                        obj1.x -= Math.cos(angle) * overlap * 2;
                        obj1.y -= Math.sin(angle) * overlap * 2;
                    }
                }
            }
        }
    }
    function attract() {
        if (animationFrame) {
            cancelAnimationFrame(animationFrame);
        }
         if (drag == null) {
            objects.forEach(e => {
               
                const dx = centerX - e.x;
                const dy = centerY - e.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                console.log(dist);
                if (dist > 10) {
                    const strength = Math.min((e.mass * 0.1) * (dist / 200), 0.1);
                    
                    e.x += dx * strength;
                    e.y += dy * strength;
                    animationFrame = requestAnimationFrame(attract);
                } else {
                    e.x = centerX;
                    e.y = centerY;
                }
                
            });
            collisions();
        }
    }
    function create(e: MouseEvent) {
        const x = e.clientX;
        const y = e.clientY;
        const newObj: {name: string, x: number, y: number, size: number, mass: number} = {
            name: 'new', 
            x: x, 
            y: y, 
            size: 100,
            mass: 1
        };
        objects.push(newObj);
        objectsStore.updateAll(objects);
    }
    updateObjects();
</script>

<svelte:window {onmousemove} {onwheel} />

<div class="absolute top-0 left-0 size-full z-0" onclick={(e) => create(e)}>
    {#each objects as {name, x, y, size}, i}
        <Object {name} {x} {y} {size} {onmousedown} {onmouseup} />
    {/each}
</div>

