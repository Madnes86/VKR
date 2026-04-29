<script lang="ts">
    import { untrack } from "svelte";
    import { Object, Link } from "$lib/components";
    import { treeStore, objects as flatObjects } from "$lib/stores/objects.svelte";
    import { scaleStore } from "$lib/stores/scale.svelte";
    import { dragStore } from "$lib/stores/drag.svelte";
    import { resizeObjects, runPhysicsLoop } from "$lib/functions/physics";
    import { contextStore } from "$lib/stores/context.svelte";
    import { searchStore } from "$lib/stores/search.svelte";
    import { side } from "$lib/stores/other.svelte";
    import { computeSearchVisibility } from "$lib/functions/search";
    import { computeAppearanceOrder, getRevealDelay } from "$lib/functions/appearance";
    import { appearanceStore } from "$lib/stores/appearance.svelte";
    import { computeGhosts } from "$lib/functions/ghosts";
    import { i18n } from "$lib/i18n";
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

    // Режим «распутывания»: дальние связи заменяются короткими копиями
    // объектов рядом с источником. Тени — чисто визуальные.
    let duplicationMode: boolean = $state(false);
    let ghosts = $derived(duplicationMode ? computeGhosts(objects, links) : []);
    let hiddenLinkIds = $derived(new Set(ghosts.map(g => g.linkId)));

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
        // знал актуальный набор и забыл устаревшие. Заодно строим
        // карту id→объект для последующего поиска массы.
        const allIds = new Set<number>();
        const idToObj = new Map<number, ITreeObject>();
        function walk(o: ITreeObject) {
            allIds.add(o.id);
            idToObj.set(o.id, o);
            for (const c of o.objects ?? []) walk(c);
        }
        for (const o of targetObjects) walk(o);

        // untrack: чтения/записи appearanceStore не должны делать этот
        // эффект реактивным к нему — иначе reveal() ре-триггерит эффект
        // и таймер обнуляется на каждой итерации, всё появляется разом.
        const order = computeAppearanceOrder(targetObjects, targetLinks);
        const toReveal = untrack(() => {
            appearanceStore.forget(allIds);
            return order.filter(id => !appearanceStore.has(id));
        });

        let cancelled = false;
        let timer: ReturnType<typeof setTimeout> | undefined;
        let i = 0;

        function reveal() {
            if (cancelled || i >= toReveal.length) return;
            const id = toReveal[i++];
            appearanceStore.reveal(id);
            if (i < toReveal.length) {
                // Задержка перед СЛЕДУЮЩИМ объектом масштабируется по
                // массе только что показанного — тяжёлые держат паузу.
                const mass = idToObj.get(id)?.mass ?? 1;
                timer = setTimeout(reveal, getRevealDelay(mass));
            }
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
            getLinks: () => links,
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

        {#if is && to && appearanceStore.has(l.is) && appearanceStore.has(l.to) && !hiddenLinkIds.has(l.id)}
            <Link id={l.id} name={l.name} type={l.type} {is} {to} />
        {/if}
    {/each}

    <!-- Тени дублированных эндпоинтов и короткие ghost-связи к ним.
         Тень рендерится как полупрозрачная капсула с именем; короткая
         «ghost-link» соединяет тень с её якорем. Оригинальный длинный
         link при этом скрыт через hiddenLinkIds. -->
    {#each ghosts as g (g.linkId)}
        {@const source = objects.find(o => o.id === g.sourceId)}
        {#if source && appearanceStore.has(g.sourceId) && appearanceStore.has(g.originalId)}
            {@const ghostObj = { id: g.originalId, x: g.x, y: g.y, size: g.size, name: g.name } as ITreeObject}
            {@const origLink = links.find(l => l.id === g.linkId)}
            {#if origLink}
                <Link
                    id={-g.linkId}
                    name={origLink.name}
                    type={origLink.type}
                    is={source}
                    to={ghostObj}
                />
            {/if}
            <div
                data-testid="ghost"
                style="left: {g.x}px; top: {g.y}px; width: {g.size}px; height: {g.size}px; z-index: {g.originalId}"
                class="absolute rounded-full bg-black opacity-50 outline outline-dashed outline-white pointer-events-none flex items-center justify-center"
            >
                <span class="text-border text-white" style="font-size: {g.size / 8}px">{g.name}</span>
            </div>
        {/if}
    {/each}
</div>

<button
    type="button"
    onclick={() => (duplicationMode = !duplicationMode)}
    title={i18n.t('diagram.duplicate.title')}
    class="absolute top-3 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-md bg-gray-glass text-border border border-accent hover:bg-accent transition-colors select-none"
>
    {duplicationMode ? i18n.t('diagram.duplicate.on') : i18n.t('diagram.duplicate.off')}
</button>

