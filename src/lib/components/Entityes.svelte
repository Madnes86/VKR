<script lang="ts">
    import { objects } from "$lib/stores/objects.svelte";
    import type { IFlatObject } from "$lib/interface";
    import { TreeForm } from "$lib/components";

    let entityes: IFlatObject[] = $derived(objects.all ?? []);
</script>

<div class="flex flex-col gap-2 items-start w-full">
    {#each entityes as {id, name, parent}}
        <div class="w-full flex">
            <TreeForm {id} {name} text={name} type='o' />
        </div>
    {/each}
</div>