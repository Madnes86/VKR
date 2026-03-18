<script lang="ts">
    import { TreeItem, Icon, Form } from "$lib/components";
    import { selectedStore } from "$lib/stores/objects.svelte";
    type IObject = {
        id: number;
        name: string; 
        objects: IObject[];
    }
    let {
        id,
        name,
        objects
    } : {
        id: number;
        name?: string;
        objects: IObject[];
    } = $props();

    let show: boolean = $state(false);
    let isObjects: boolean = $derived(objects?.length > 0);
    let selected: boolean = $derived(selectedStore.selected == id);

    function onclick() {
        show = !show;
    }
    function ondblclick(e: MouseEvent) {
        e.stopPropagation();
        console.log(id, objects);
        selectedStore.set(id);
    }
    function selecting(e: MouseEvent) {
        e.stopPropagation();
        selectedStore.set(id);
    }
</script>

<div class="flex flex-col w-full" {ondblclick} onclick={selecting}>
    {#if name}
        <div class={`${!isObjects && 'ml-6'} ${selected && 'bg-accent'} flex gap-2 items-center`}>
            <button {onclick} class={`${show && 'rotate-90'} click p-1 rounded-md hover:bg-gray`}>
                {#if isObjects}
                    <Icon name="arrow" />
                {/if}
            </button>
            <Form icon="entityes" text={name} />
        </div>
    {/if}
    {#if show || !name}
        <div class={`${isObjects && 'ml-4!'}`}>
            {#each objects as {id, name, objects}}
                <TreeItem {id} {name} {objects} />
            {/each}
        </div>
    {/if}
</div>