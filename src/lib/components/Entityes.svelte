<script lang="ts">
    /**
     * Entityes — вкладка со списком классов проекта, отрисовывается как дерево
     * наследования (parent = extends). Переиспользует TreeItem/TreeForm, чтобы
     * визуально согласоваться с вкладкой "graph", и питается из того же
     * treeStore (derived от buildTree над objects/links).
     */
    import { TreeItem } from "$lib/components";
    import { treeStore, objects } from "$lib/stores/objects.svelte";
    import { searchStore } from "$lib/stores/search.svelte";
    import { flatTree } from "$lib/functions/other";

    const root = $derived(treeStore.all.id);
    const currentObj = $derived(treeStore.all.objects ?? []);
    const links = $derived(treeStore.all.links ?? []);

    // Подсветка по поиску и категориям — как в Tree.svelte (optional / Local).
    let highlightedIds = $derived.by(() => {
        const query = searchStore.get().toLowerCase().trim();
        const cats = searchStore.cats;
        const all = objects.all;

        const isWeak = cats.find(c => c.name === 'optional')?.check;
        const isLocal = cats.find(c => c.name === 'Local search')?.check;
        const local = flatTree(treeStore.all);

        if (!query && !isWeak && !isLocal) {
            return { ids: new Set<number>(), query: '' };
        }

        const filtered = all.filter(e => {
            const matchesQuery = !query || e.name.toLowerCase().includes(query);
            let matchesCat = true;
            if (isWeak && isLocal) matchesCat = e.type === 'optional' && local.has(e.id);
            else if (isWeak) matchesCat = e.type === 'optional';
            else if (isLocal) matchesCat = local.has(e.id);
            return matchesQuery && matchesCat;
        });

        return { ids: new Set(filtered.map(e => e.id)), query };
    });
</script>

<div class="p-1 flex flex-col w-full">
    <TreeItem id={root} objects={currentObj} {links} {highlightedIds} />
</div>
