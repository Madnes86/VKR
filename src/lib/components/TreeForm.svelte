<script lang="ts">
    import { Icon } from "$lib/components";
	// import type { IObject, ILink } from "$lib/interface";
    import { selectedStore, viewStore } from "$lib/stores/objects.svelte";

    let {
        id,
        name,
        type,
        more,
        query
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
    let state: boolean = $state(true);
    let icon: string = $derived.by(() => {
        if (type === 'o') {
            return more ? 'objects' : 'object'; 
        } else {
            return more ? 'lines' : 'line';
        }
    });
        let match = $derived.by(() => {
        const n = name.toLowerCase();
        if (!query || !n.includes(query)) return { start: -1, end: -1 };
        const start = n.indexOf(query);
        return { start, end: start + query.length };
    });

    const onmouseenter = () => selectedStore.set('hover', data);
    const onmouseleave = () => selectedStore.clear('hover');
    const onclick      = () => selectedStore.set('selected', data);
    const toggle       = () => state = !state;

    function ondblclick(e: MouseEvent) {
        if (type === 'l') return;
        e.stopPropagation();
        viewStore.set(id);
    }

</script>
<!-- TODO: rename -->
<!-- TODO: function toggle type -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div 
    {ondblclick} 
    {onmouseenter} 
    {onmouseleave} 
    data-testid="row"
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
            <input bind:value={name} type="text" class={`w-full focus:outline-none bg-transparent p-0 h-6 border-0`}>
        {/if}
    </button>
    {#if hover || !state}
        <button onclick={toggle} class="click p-1 hover:bg-gray rounded-sm">
            {#if state}
                <Icon name="edit" />
            {:else}
                <Icon name="check" stroke="green" />
            {/if}
        </button>
    {/if}
</div>