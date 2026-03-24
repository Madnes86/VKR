<script lang="ts">
    import { TreeItem, Search } from "$lib/components";
    import { treeStore, objects } from "$lib/stores/objects.svelte";
    import type { ITreeObject, ILink } from "$lib/interface";
	import { searchStore } from "$lib/stores/search.svelte";
	import { flatTree } from "$lib/functions/other";

    const root = treeStore.all.id;
    const currentObj = $derived(treeStore.all.objects);
    const links = $derived(treeStore.all.links)

    let highlightedIds = $derived.by(() => {
        const query = searchStore.get().toLowerCase().trim();
        const cats = searchStore.cats;
        const all = objects.all;
        
        const isWeak = cats.find(c => c.name === 'optional')?.check;
        const isLocal = cats.find(c => c.name === 'Local search')?.check;
        const local = flatTree(treeStore.all); // ID текущего дерева

        // Если поиска нет и категории не выбраны — ничего не подсвечиваем
        if (!query && !isWeak && !isLocal) return { ids: new Set<number>(), query: '' };

        const filtered = all.filter(e => {
            const matchesQuery = !query || e.name.toLowerCase().includes(query);
            let matchesCat = true;
            
            if (isWeak && isLocal) matchesCat = e.type === 'optional' && local.has(e.id);
            else if (isWeak) matchesCat = e.type === 'optional';
            else if (isLocal) matchesCat = local.has(e.id);

            return matchesQuery && matchesCat;
        });

        return {
            ids: new Set(filtered.map(e => e.id)),
            query: query
        }
            
    });
    $inspect(highlightedIds);

</script>

    <Search />

    <div class="border-t-2 p-1 border-gray flex flex-col w-full">
        <TreeItem id={root} objects={currentObj} {links} {highlightedIds} />
    </div>