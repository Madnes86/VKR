<script lang="ts">
    import { TreeItem, Icon, TreeForm } from "$lib/components";
    import type { IObject, ILink } from "$lib/interface";

    let {
        id,
        name,
        objects,
        links,
    } : {
        id: number;
        name?: string;
        objects: IObject[];
        links?: ILink[];
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
            <TreeForm {id} {name} text={name} type='o'/>
            
        </div>
    {/if}
    {#if show || !name}
        <div class={`${isObjects && 'ml-4!'}`}>
            {#each objects as {id, name, objects, links}}
                <TreeItem {id} {name} {objects} {links} />
            {/each}
            <div class={`ml-6 flex gap-2 items-center`} >
                {#each links as {id, name}}
                    <TreeForm {id} {name} text={name} type='l' />
                {/each}
            </div>
        </div>
    {/if}
</div>