<script lang="ts">
    import { Icon } from "$lib/components";
	import type { IObject, ILink } from "$lib/interface";
    import { selectedStore, viewStore } from "$lib/stores/objects.svelte";

    let {
        id,
        name,
        type,
        more,
        query,
    } : {
        id: number
        name: string
        type: 'o' | 'l'
        more?: boolean
        query: string
    } = $props();

    let data = $derived(`${type} + ${id}`);
    let selected: boolean = $derived(selectedStore.selected === data);
    let hover: boolean = $derived(selectedStore.hover === data);
    let icon: string = $derived.by(() => {
        if (type === 'o') {
            return more ? 'objects' : 'object'; 
        } else {
            return more ? 'lines' : 'line';
        }
    });
    let state: boolean = $state(true);

    function onmouseenter() {
        selectedStore.set("hover", data);
    }
    function onmouseleave() {
        selectedStore.clear('hover');
    }

    function onclick() {
        selectedStore.set("selected", data);
    }
    function ondblclick(e: MouseEvent) {
        if (type === 'l') return;
        e.stopPropagation();
        viewStore.set(id);
    }
        // Находим позицию совпадения
    let match = $derived.by(() => {
        if (!query || query.trim() === '') return { start: -1, end: -1 };
        const start = name.toLowerCase().indexOf(query.toLowerCase());
        if (start === -1) return { start: -1, end: -1 };
        return { start, end: start + query.length };
    });
    $inspect(match);


</script>
<!-- TODO: rename -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div 
    {ondblclick} 
    {onmouseenter} 
    {onmouseleave} 
    class={`${selected && 'border-accent border'} ${hover && 'outline-accent outline-1'} m-1 rounded-sm flex gap-2 w-full`}>
    <button {onclick} class="click flex gap-2 p-1 items-center w-full">
        <Icon name={icon} />
        {#if state}
            <p>
                {#each name as symbol, i}
                    {@const isMatch = i >= match.start && i < match.end}
                    {@const isFirst = i === match.start}
                    {@const isLast  = i === match.end - 1}
                    <span class="{isMatch && 'bg-accent'} {isFirst && 'rounded-l-xs'} {isLast && 'rounded-r-xs'}">{symbol}</span>
                {/each}
            </p>
        {:else}
            <input bind:value={name} type="text">
        {/if}
    </button>
    {#if hover}
        <button class="click p-1 hover:bg-gray rounded-sm">
            <Icon name="edit" />
        </button>
    {/if}
</div>