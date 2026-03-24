<script lang="ts">
    import { objects, treeStore } from "$lib/stores/objects.svelte";
    // import type { IFlatObject } from "$lib/interface";
    import { searchStore } from "$lib/stores/search.svelte";
    import { TreeForm, Search } from "$lib/components";

    let entityes = $derived.by(() => {
        const query = searchStore.get().toLowerCase().trim();
        const allEntityes = objects.all

        if (!query) return allEntityes;
        return allEntityes.filter(e => e.name.toLowerCase().includes(query));
    });
    $inspect(searchStore.cats);

</script>

    <Search />

    <div class="flex flex-col gap-2 items-start w-full">
        {#each entityes as {id, name, parent}}
            {@const more = parent !== null ? true : false}

            <div class="w-full flex">
                <TreeForm {id} {name} type='o' {more} />
            </div>
        {/each}
    </div>