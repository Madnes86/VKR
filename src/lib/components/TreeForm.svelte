<script lang="ts">
    import { Icon } from "$lib/components";
	import type { IObject, ILink } from "$lib/interface";
    import { selectedStore, viewStore } from "$lib/stores/objects.svelte";

    let {
        id,
        name,
        text,
        type
    } : {
        id: number
        name: string
        text: string
        type: 'o' | 'l'
    } = $props();

    let data = $derived(`${type} + ${id}`);
    let selected: boolean = $derived(selectedStore.selected === data);
    let hover: boolean = $derived(selectedStore.hover === data);
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

</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div 
    {ondblclick} 
    {onmouseenter} 
    {onmouseleave} 
    class={`${selected && 'border-accent border'} ${hover && 'outline-accent outline-1'} m-1 rounded-sm flex gap-2 w-full`}>
    <button {onclick} class="click flex gap-2 p-1 items-center w-full">
        <Icon name={name} />
        {#if state}
            <p>{name}</p>
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