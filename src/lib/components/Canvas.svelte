<script lang="ts">
    import { Object, Link } from "$lib/components";
    import { objectsStore } from "$lib/stores/objects";
    import { linksStore } from "$lib/stores/links.svelte";

    let object: HTMLElement | null = $state(null);
    let offsetX: number = 0;
    let offsetY: number = 0;
    let drag: string | null = $state(null);

    let center: boolean = $state(true);

    let objects: {id: number, name: string, x: number, y: number, size: number, mass: number}[] = $state([]);
    objectsStore.subscribe(v => objects = [...v]);
    let links: {id: number, name: string, objects: {is: number, to: number}[]}[] = [];
    linksStore.subscribe(v => links = [...v]);
    let sortLink = $derived(
        links.map(link => {
            // Для каждого объекта связи получаем координаты
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

    let centerX: number = window.innerWidth / 2;
    let centerY: number = window.innerHeight / 2;
    let scale: number = $state(1);
    let animationFrame: number | null = $state(null);
    const SIZE: number = 100;

    function onwheel(event: WheelEvent) {
        scale = event.deltaY > 0 ? scale -= 1.01 : scale += 1.01;
        scale = Math.max(0.5, Math.min(3, scale));
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
        if (drag) {
            objects.forEach(e => {
                if (e.name === drag) {
                    e.x = event.clientX - offsetX;
                    e.y = event.clientY - offsetY;
                }
            });
        }
    }
    let targetObj = $state(0);
    function linking(e: MouseEvent, id: number) {
        targetObj = id;
    }
    function onmouseup(id: number) {
        if (targetObj > 0) {
            linksStore.addLink({id: 20, name: 'test', objects: [{is: targetObj, to: id}]});
            targetObj = 0;
        }
    }
    function physics() {
        if (drag) return;

        const forces = objects.map(() => ({ fx: 0, fy: 0 }));

        // Приоритет #1: Коллизии с зазором 30%
        for (let i = 0; i < objects.length; i++) {
            const obj1 = objects[i];
            const centerX1 = obj1.x + obj1.size / 2;
            const centerY1 = obj1.y + obj1.size / 2;

            for (let j = i + 1; j < objects.length; j++) {
                const obj2 = objects[j];
                const centerX2 = obj2.x + obj2.size / 2;
                const centerY2 = obj2.y + obj2.size / 2;

                const dx = centerX1 - centerX2;
                const dy = centerY1 - centerY2;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                const desiredDist = (obj1.size + obj2.size) * (1 + 0.3);
                
                if (dist < desiredDist && dist > 0.01) {
                    const compression = 1 - (dist / desiredDist);
                    const strength = 1.5 * Math.pow(compression, 1.5) * (obj1.mass + obj2.mass);
                    
                    const nx = dx / dist;
                    const ny = dy / dist;
                    
                    const totalMass = obj1.mass + obj2.mass;
                    const massRatio1 = obj2.mass / totalMass;
                    const massRatio2 = obj1.mass / totalMass;
                    
                    forces[i].fx += nx * strength * massRatio2;
                    forces[i].fy += ny * strength * massRatio2;
                    forces[j].fx -= nx * strength * massRatio1;
                    forces[j].fy -= ny * strength * massRatio1;
                }
            }
        }

        // Приоритет #2: Гравитация к центру
        if (center) {
            for (let i = 0; i < objects.length; i++) {
                const obj1 = objects[i];
                const centerX1 = obj1.x + obj1.size / 2;
                const centerY1 = obj1.y + obj1.size / 2;

                const dx = centerX - centerX1;
                const dy = centerY - centerY1;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist > 1) {
                    // Большие объекты сильнее притягиваются к центру
                    const massFactor = Math.pow(obj1.mass, 2);
                    const strength = 0.01 * massFactor * Math.min(dist / 300, 1);
                    
                    forces[i].fx += dx * strength * 0.9;
                    forces[i].fy += dy * strength * 0.9;
                }
            }
        }

        // Применяем силы
        for (let i = 0; i < objects.length; i++) {
            const MAX_MOVE = 3
            objects[i].x += forces[i].fx * 0.9;
            objects[i].y += forces[i].fy * 0.9;
        }
    }
    function create(e: MouseEvent) {
        if (drag) {
            drag = null;
        } else {
            const x = e.clientX - SIZE / 2;
            const y = e.clientY - SIZE / 2;
            const name = (objects.length + 1).toString();
            const newObj: {id: number, name: string, x: number, y: number, size: number, mass: number} = {
                id: Math.random(),
                name: name, 
                x: x, 
                y: y, 
                size: SIZE,
                mass: 2
            };
            objects.push(newObj);
            objectsStore.updateAll(objects);
            updateObjects();
        }
    }
    function toggle() {
        center = !center;
    }
    updateObjects();
    function loop() {
        physics();
        animationFrame = requestAnimationFrame(loop);
    }
    setTimeout(() => {
        loop();
    }, 1000);
</script>

<svelte:window {onmousemove} {onwheel} />

<button onclick={toggle} class="absolute z-10 right-0 p-2 click bg-accent">
    centering
</button>

<div class="fixed top-0 left-0 size-full z-0" onclick={(e) => create(e)}>
    {#each objects as {id, name, x, y, size}, i}
        <Object {id} {name} {x} {y} {size} {onmousedown} {onmouseup} {linking}/>
    {/each}
    {#each sortLink as {id, name, x1, y1, x2, y2}}
        <Link {id} {name} {x1} {y1} {x2} {y2} />
    {/each}
</div>

