<script lang="ts">
    import { TreeItem, Icon, TreeForm } from "$lib/components";
    import type { IObject, ILink } from "$lib/interface";

    let {
        id,
        name,
        objects,
        links,
        highlightedIds,
    } : {
        id: number;
        name?: string;
        objects: IObject[];
        links?: ILink[];
        highlightedIds: { ids: Set<number>, query: string };
    } = $props();

    let isObjects: boolean = $derived(objects?.length > 0);
    let show: boolean = $derived(true);
    const query = $derived(highlightedIds.query);

    function onclick() {
        show = !show;
    }
</script>

<div class="flex flex-col gap-1 w-full">
    {#if name}
        <div class="flex gap-2 items-center">
            {#if isObjects}
                <button {onclick} class={`${show && 'rotate-90'} click p-1 rounded-md hover:bg-gray`}>
                        <Icon name="arrow" />
                </button>
            {/if}
            <TreeForm {id} {name} type='o' more={isObjects} {query} />
        </div>
    {/if}
    {#if show || !name}
        <div class={`${name && isObjects && 'ml-10!'}`}>
            {#each objects as {id, name, objects, links}}
                <TreeItem {id} {name} {objects} {links} {highlightedIds} />
            {/each}
            <div class="flex flex-col gap-2 items-center">
                {#each links as {id, name}}
                    <TreeForm {id} {name} type='l' more={false} {query} />
                {/each}
            </div>
        </div>
    {/if}
</div>