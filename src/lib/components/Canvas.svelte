<script lang="ts">
    import { Object } from "$lib/components";

    let objects = $state([
        {name: "obj1", x: 300, y: 0, size: 100},
        {name: "obj2", x: 0, y: 0, size: 100},
    ]);
    let object: HTMLElement | null = $state(null);
    let offsetX: number = 0;
    let offsetY: number = 0;
    let drag: string | null = $state(null);

    let centerX: number = window.innerWidth / 2;
    let centerY: number = window.innerHeight / 2;
    const F: number = 0.05;
    const F_REPULSION: number = 0.1;

    function onmousedown(event: MouseEvent, name: string, ref: HTMLElement) {
        drag = name;
        object = ref;
        console.log(object);
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
        collisions();
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
                    const overlap = (minDist + repulsion - dist) / 2;
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
         if (drag == null) {
            objects.forEach(e => {
               
                const dx = centerX - e.x;
                const dy = centerY - e.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist > 1) {
                    const strength = Math.min(F * (dist / 200), 0.1);
                    
                    e.x += dx * strength;
                    e.y += dy * strength;
                    // requestAnimationFrame(attract);
                } else {
                    e.x = centerX;
                    e.y = centerY;
                }
                
            });
            collisions();
        }
    }
</script>

<svelte:window {onmousemove} />

<div class="absolute top-0 left-0 size-screen z-0">
    {#each objects as {name, x, y, size}, i}
        <Object {name} {x} {y} {size} {onmousedown} {onmouseup} />
    {/each}
</div>

