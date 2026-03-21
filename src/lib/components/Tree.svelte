<script lang="ts">
    import { TreeItem, Search } from "$lib/components";
    import { treeStore } from "$lib/stores/objects.svelte";
    import type { ITreeObject, ILink } from "$lib/interface";

    let objects: ITreeObject[] | null = $derived(treeStore.all.objects ?? []);
    let links: ILink[] | null = $derived(treeStore.all.links ?? []);
    
</script>

    <Search />

    <div class="border-t-2 p-1 border-gray flex flex-col w-full">
        <TreeItem id={0} {objects} {links} />
    </div>