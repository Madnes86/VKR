<script lang="ts">
    import { Object, Link } from "$lib/components";
    import { treeStore, objects as flatObjects } from "$lib/stores/objects.svelte";
    import { scaleStore } from "$lib/stores/scale.svelte";
    import { dragStore } from "$lib/stores/drag.svelte";
    import { resizeObjects, runPhysicsLoop } from "$lib/functions/physics";
    import { contextStore } from "$lib/stores/context.svelte";
    import { searchStore } from "$lib/stores/search.svelte";
    import { side } from "$lib/stores/other.svelte";
    import { computeSearchVisibility } from "$lib/functions/search";
    import { computeAppearanceOrder, REVEAL_DELAY } from "$lib/functions/appearance";
    import type { ITreeObject, ILink } from "$lib/interface";

    let width: number = $state(0);
    let height: number = $state(0);
    let centerX = $derived.by(() => {
        const leftWidth = side.v[0]?.width ?? 0;
        const rightWidth = side.v[1]?.width ?? 0;

        return (leftWidth + width - rightWidth) / 2;
    });
    let centerY: number = $derived(height / 2);
    let id: number | null = $state(treeStore.all.id ?? null);
    let objects: ITreeObject[] = $state([]);
    let links: ILink[] = $state([]);

    function onwheel(e: WheelEvent) {
        scaleStore.value = e.deltaY > 0 ? scaleStore.value -= 1.01 : scaleStore.value += 1.01;
        resizeObjects(objects, scaleStore.value);
    }
    function onmousemove(e: MouseEvent) { // ?
        const dragObj = dragStore.getValue();
        
        if (dragObj) {
            const obj = objects.find(o => o.id === dragObj.id);

            if (!obj) return;
            obj.x = e.clientX - dragObj.offsetX;
            obj.y = e.clientY - dragObj.offsetY;
        }
    }

    function oncontextmenu(e: MouseEvent) {
        e.preventDefault();
        e.stopPropagation();
        contextStore.set(e, id);
    }
    // Подсчёт visibility — не делаем spread, чтобы оригинальные ITreeObject
    // (на которые мутирует physics x/y) сохранились между переключениями
    // фильтра. Filter возвращает массив с теми же refs.
    let visibility: Set<number> | null = $derived.by(() => {
        const q = searchStore.get().trim();
        if (!searchStore.applied || !q) return null;
        return computeSearchVisibility(flatObjects.all, q);
    });

    // ID объектов, которые уже «появились» на холсте. Сохраняется между
    // ре-ранами эффекта, чтобы при изменении фильтра / добавлении новых
    // объектов уже показанные не пересобирались с задержкой заново.
    const shownIds = new Set<number>();

    $effect(() => {
        const data = treeStore.all;
        const v = visibility;
        if (!data || !data.objects) return;

        const baseLinks = data.links ?? [];
        const targetObjects = v ? data.objects.filter(o => v.has(o.id)) : data.objects;
        const targetLinks = v
            ? baseLinks.filter(l => v.has(l.is) && v.has(l.to))
            : baseLinks;

        const targetIds = new Set(targetObjects.map(o => o.id));
        // Удаляем из shownIds то, что больше не должно быть видимым.
        for (const id of [...shownIds]) if (!targetIds.has(id)) shownIds.delete(id);

        // Уже показанные оставляем мгновенно, новые ставим в очередь по
        // приоритету (масса ↓, связи с показанными ↓).
        const alreadyShown = targetObjects.filter(o => shownIds.has(o.id));
        const toReveal = targetObjects.filter(o => !shownIds.has(o.id));
        const order = computeAppearanceOrder(toReveal, targetLinks);

        objects = alreadyShown;
        links = targetLinks.filter(l => shownIds.has(l.is) && shownIds.has(l.to));

        let cancelled = false;
        let timer: ReturnType<typeof setTimeout> | undefined;
        let i = 0;

        function reveal() {
            if (cancelled || i >= order.length) return;
            const nextId = order[i++];
            const obj = toReveal.find(o => o.id === nextId);
            if (obj) {
                shownIds.add(obj.id);
                objects = [...objects, obj];
                links = targetLinks.filter(l => shownIds.has(l.is) && shownIds.has(l.to));
            }
            if (i < order.length) timer = setTimeout(reveal, REVEAL_DELAY);
        }

        if (order.length > 0) {
            // Первый — сразу, дальнейшие — с задержкой.
            reveal();
        }

        return () => {
            cancelled = true;
            if (timer !== undefined) clearTimeout(timer);
        };
    });
    $effect(() => {
        if (objects.length === 0) return;

        resizeObjects(objects, scaleStore.value);
        return runPhysicsLoop({
            getObjects: () => objects,
            getCenter: () => ({ x: centerX, y: centerY }),
            isPaused: () => dragStore.hasValue(),
            onWakeSignal: (wake) => dragStore.subscribe(() => wake()),
        });
    });
</script>

<svelte:window {oncontextmenu} {onmousemove} {onwheel} bind:innerWidth={width} bind:innerHeight={height} />

<div class="fixed top-0 left-0 size-full z-0">
    {#each objects as {id, name, type, x, y, size, objects, links}, i}
        <Object {id} {name} {type} {x} {y} {size} {objects} {links} selParent={false}/>
    {/each}
    {#each links as l}
        {@const is = objects.find(o => o.id === l.is)}
        {@const to = objects.find(o => o.id === l.to)}

        {#if is && to}
            <Link id={l.id} name={l.name} type={l.type} {is} {to} />
        {/if}
    {/each}
</div>

