<script lang="ts">
    import { TreeItem, Icon, Form, TreeForm } from "$lib/components";
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

    function onclick() {
        show = !show;
    }
</script>

<div class="flex flex-col gap-1 w-full">
    {#if name}
        <div class={`${!isObjects && 'ml-6'} flex gap-2 items-center`}>
            {#if isObjects}
                <button {onclick} class={`${show && 'rotate-90'} click p-1 rounded-md hover:bg-gray`}>
                        <Icon name="arrow" />
                </button>
            {/if}
            <TreeForm {id} name="entityes" text={name} />
            <!-- <Form icon="entityes" text={name} /> -->
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