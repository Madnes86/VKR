<script lang="ts">
    import { selectedStore, links as linksStore } from "$lib/stores/objects.svelte";
    import { validationStore } from "$lib/stores/validation.svelte";
    import { LightText } from "$lib/components";
    import type { ILink } from "$lib/interface";

    let {
        id,
        name,
        type,
        is,
        to,
        isValue = false,
        toValue = true,
    } : ILink & { isValue?: boolean; toValue?: boolean } = $props();

    let data: string = $derived(`l + ${id}`);
    let selected: boolean = $derived(selectedStore.selected === data);
    let hover: boolean = $derived(selectedStore.hover === data);
    let dasharray: string = $derived(type === 'default' ? '0' : '8 8');

    let x1 = $derived(is.x + is.size / 2);
    let y1 = $derived(is.y + is.size / 2);
    let x2 = $derived(to.x + to.size / 2);
    let y2 = $derived(to.y + to.size / 2);
    let r1 = $derived(is.size / 2);
    let r2 = $derived(to.size / 2);
    let size = $derived((is.size + to.size) / 2);

    let dx = $derived(x2 - x1);
    let dy = $derived(y2 - y1);
    let dist = $derived(Math.hypot(dx, dy) || 1);

    const unitX = $derived(dx / dist);
    const unitY = $derived(dy / dist);

    let sx = $derived(x1 + unitX * r1);
    let sy = $derived(y1 + unitY * r1);
    let ex = $derived(x2 - unitX * r2);
    let ey = $derived(y2 - unitY * r2);
    let midX: number = $derived((sx + ex) / 2);
    let midY: number = $derived((sy + ey) / 2);

    // Уникальные id маркеров на ребро — иначе все стрелки делят один marker и
    // hover-цвет будет «протекать» между линиями.
    let markerStart = $derived(`arrow-s-${id}`);
    let markerEnd = $derived(`arrow-e-${id}`);
    // Размер наконечника привязан к размерам эндпоинтов — как и у имени
    // связи. Минимум 4, чтобы стрелка оставалась видимой даже на
    // мелких объектах.
    let markerSize: number = $derived(Math.max(4, size / 46));
    let strokeColor = $derived.by(() => {
        if (selected || hover) return 'var(--color-accent)';
        const sev = validationStore.severityForLink(id);
        if (sev === 'error')   return 'var(--color-red)';
        if (sev === 'warning') return 'var(--color-yellow)';
        return 'white';
    });

    function onclick() { selectedStore.set('selected', data) }
    function onmouseenter() { selectedStore.set('hover', data) }
    function onmouseleave() { selectedStore.clear('hover') }

    // ── редактирование имени ────────────────────────────────────────────────
    let editing: boolean = $state(false);
    let draftName: string = $state('');

    function startEdit(e: MouseEvent) {
        e.stopPropagation();
        draftName = name;
        editing = true;
    }
    function commit() {
        const next = draftName.trim();
        if (next && next !== name) linksStore.update(id, { name: next });
        editing = false;
    }
    function onKeydown(e: KeyboardEvent) {
        if (e.key === 'Enter') { e.preventDefault(); commit(); }
        else if (e.key === 'Escape') { editing = false; draftName = name; }
    }

    function toggleArrow(end: 'is' | 'to') {
        if (end === 'is') linksStore.update(id, { isValue: !isValue });
        else linksStore.update(id, { toValue: !toValue });
    }
</script>

<div>
    <svg class="absolute top-0 left-0 size-full">
        <defs>
            <marker id={markerStart} viewBox="0 0 10 10" refX="2" refY="5"
                    markerWidth={markerSize} markerHeight={markerSize} orient="auto-start-reverse">
                <path d="M 10 0 L 0 5 L 10 10 z" fill={strokeColor} />
            </marker>
            <marker id={markerEnd} viewBox="0 0 10 10" refX="8" refY="5"
                    markerWidth={markerSize} markerHeight={markerSize} orient="auto">
                <path d="M 0 0 L 10 5 L 0 10 z" fill={strokeColor} />
            </marker>
        </defs>
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <line
            {onmouseenter}
            {onmouseleave}
            {onclick}
            x1={sx}
            y1={sy}
            x2={ex}
            y2={ey}
            stroke={strokeColor}
            stroke-width={3}
            stroke-dasharray={dasharray}
            stroke-linecap="round"
            marker-start={isValue ? `url(#${markerStart})` : undefined}
            marker-end={toValue ? `url(#${markerEnd})` : undefined}
        />
    </svg>
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
        {onmouseenter}
        {onmouseleave}
        {onclick}
        ondblclick={startEdit}
        style="left: {midX}px; top: {midY}px; font-size: {size / 8}px; z-index: 99999999"
        class="absolute -translate-1/2 flex items-center gap-1 text-border"
    >
        {#if editing}
            <!-- svelte-ignore a11y_autofocus -->
            <input
                autofocus
                bind:value={draftName}
                onkeydown={onKeydown}
                onblur={commit}
                onclick={(e) => e.stopPropagation()}
                style="font-size: {size / 8}px; width: {Math.max(draftName.length, 4) + 1}ch"
                class="px-1 py-0.5 rounded-sm bg-gray-glass text-border border border-accent outline-none"
            />
        {:else}
            <button
                ondblclick={startEdit}
                title="Двойной клик — переименовать"
                class="whitespace-nowrap select-none cursor-text"
            ><LightText text={name} /></button>
        {/if}
        {#if hover && !editing}
            <button
                onclick={(e) => { e.stopPropagation(); toggleArrow('is'); }}
                title="Стрелка на конце «{is.name ?? ''}»"
                style="font-size: {size / 10}px"
                class="px-1 rounded-sm bg-gray-glass {isValue ? 'text-accent' : 'opacity-50'}"
            >◀</button>
            <button
                onclick={(e) => { e.stopPropagation(); toggleArrow('to'); }}
                title="Стрелка на конце «{to.name ?? ''}»"
                style="font-size: {size / 10}px"
                class="px-1 rounded-sm bg-gray-glass {toValue ? 'text-accent' : 'opacity-50'}"
            >▶</button>
        {/if}
    </div>
</div>
