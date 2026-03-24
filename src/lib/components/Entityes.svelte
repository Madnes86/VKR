<script lang="ts">
    import { objects, treeStore } from "$lib/stores/objects.svelte";
    import { searchStore } from "$lib/stores/search.svelte";
    import { TreeForm, Search } from "$lib/components";
    import { flatTree } from "$lib/functions/other";

    let entityes = $derived.by(() => {
        const query = searchStore.get();
        const all = objects.all
        const cats = searchStore.cats
        const isWeak = cats.find(c => c.name === 'optional')?.check;
        const isLocal = cats.find(c => c.name === 'Local search')?.check;
        const local = flatTree(treeStore.all);

        return all.filter(e => {
            const result = !query || e.name.toLowerCase().includes(query);

            let matchesCategory = true;

            if (isWeak && isLocal) {
                // Если включены оба — элемент должен быть Weak И быть в дереве
                matchesCategory = e.type === 'optional' && local.has(e.id);
            } else if (isWeak) {
                matchesCategory = e.type === 'optional';
            } else if (isLocal) {
                // Предполагаем, что в treeStore есть метод has или массив ids
                matchesCategory = local.has(e.id);
            }

            return result && matchesCategory;
        });
    });

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