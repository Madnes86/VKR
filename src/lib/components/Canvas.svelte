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
    import { appearanceStore } from "$lib/stores/appearance.svelte";
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

    $effect(() => {
        const data = treeStore.all;
        const v = visibility;
        if (!data || !data.objects) return;

        const baseLinks = data.links ?? [];
        const targetObjects = v ? data.objects.filter(o => v.has(o.id)) : data.objects;
        const targetLinks = v
            ? baseLinks.filter(l => v.has(l.is) && v.has(l.to))
            : baseLinks;

        objects = targetObjects;
        links = targetLinks;

        // Собираем все ID в дереве (рекурсивно), чтобы appearanceStore
        // знал актуальный набор и забыл устаревшие.
        const allIds = new Set<number>();
        function walk(o: ITreeObject) {
            allIds.add(o.id);
            for (const c of o.objects ?? []) walk(c);
        }
        for (const o of targetObjects) walk(o);
        appearanceStore.forget(allIds);

        // Полный порядок появления (включая вложенных потомков).
        // Уже показанные пропускаем — анимация только для новых ID.
        const order = computeAppearanceOrder(targetObjects, targetLinks);
        const toReveal = order.filter(id => !appearanceStore.has(id));

        let cancelled = false;
        let timer: ReturnType<typeof setTimeout> | undefined;
        let i = 0;

        function reveal() {
            if (cancelled || i >= toReveal.length) return;
            appearanceStore.reveal(toReveal[i++]);
            if (i < toReveal.length) timer = setTimeout(reveal, REVEAL_DELAY);
        }

        if (toReveal.length > 0) reveal();

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
        {#if appearanceStore.has(id)}
            <Object {id} {name} {type} {x} {y} {size} {objects} {links} selParent={false}/>
        {/if}
    {/each}
    {#each links as l}
        {@const is = objects.find(o => o.id === l.is)}
        {@const to = objects.find(o => o.id === l.to)}

        {#if is && to && appearanceStore.has(l.is) && appearanceStore.has(l.to)}
            <Link id={l.id} name={l.name} type={l.type} {is} {to} />
        {/if}
    {/each}
</div>

