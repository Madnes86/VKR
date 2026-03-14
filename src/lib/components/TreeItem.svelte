<script lang="ts">
    import { TreeItem, Icon, Form } from "$lib/components";
    type IObject = {
        name: string; 
        objects: IObject[];
    }
    let {
        name,
        objects
    } : {
        name?: string;
        objects: IObject[];
    } = $props();

    let show: boolean = $state(false);
    let isObjects: boolean = $derived(objects?.length > 0);

    function onclick() {
        show = !show;
    }
</script>

<div class="flex flex-col w-full">
    {#if name}
        <div class={`${!isObjects && 'ml-6'} flex gap-2 items-center`}>
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
            {#each objects as {name, objects}}
                <TreeItem {name} {objects} />
            {/each}
        </div>
    {/if}
</div>