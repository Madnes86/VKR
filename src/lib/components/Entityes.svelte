<script lang="ts">
    import { objects, treeStore } from "$lib/stores/objects.svelte";
    import { searchStore } from "$lib/stores/search.svelte";
    import { TreeForm, Search } from "$lib/components";
    import { flatTree } from "$lib/functions/other";

    let query = $derived(searchStore.get());
    let entityes = $derived.by(() => {
        const all = objects.all
        const cats = searchStore.cats
        const isWeak = cats.find(c => c.name === 'optional')?.check;
        const isLocal = cats.find(c => c.name === 'Local search')?.check;
        const local = flatTree(treeStore.all);

        return all.filter(e => {
            const result = !query || e.name.toLowerCase().includes(query);

            let matchesCategory = true;

            if (isWeak && isLocal) matchesCategory = e.type === 'optional' && local.has(e.id);
            else if (isWeak) matchesCategory = e.type === 'optional';
            else if (isLocal) matchesCategory = local.has(e.id);

            return result && matchesCategory;
        });
    });
    const highlightedIds = $derived({
            ids: new Set(entityes.map(e => e.id)),
            query: query
    });
    // let highlightedIds = $derived.by(() => {
    //     const query = searchStore.get().toLowerCase().trim();
    //     const cats = searchStore.cats;
    //     const all = objects.all;
        
    //     const isWeak = cats.find(c => c.name === 'optional')?.check;
    //     const isLocal = cats.find(c => c.name === 'Local search')?.check;
    //     const local = flatTree(treeStore.all); // ID текущего дерева

    //     // Если поиска нет и категории не выбраны — ничего не подсвечиваем
    //     if (!query && !isWeak && !isLocal) return { ids: new Set<number>(), query: '' };

    //     const filtered = all.filter(e => {
    //         const matchesQuery = !query || e.name.toLowerCase().includes(query);
    //         let matchesCat = true;
            
    //         if (isWeak && isLocal) matchesCat = e.type === 'optional' && local.has(e.id);
    //         else if (isWeak) matchesCat = e.type === 'optional';
    //         else if (isLocal) matchesCat = local.has(e.id);

    //         return matchesQuery && matchesCat;
    //     });

    //     return {
    //         ids: new Set(filtered.map(e => e.id)),
    //         query: query
    //     }      
    // });

</script>

    <Search />

    <div class="flex flex-col gap-2 items-start w-full">
        {#each entityes as {id, name, type, parent}}
            {@const more = parent !== null ? true : false}

            <div class="w-full flex">
                <TreeForm {id} {name} type='o' {more} query={highlightedIds.query} />
            </div>
        {/each}
    </div>