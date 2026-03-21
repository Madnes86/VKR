<script lang="ts">
	import Flex from "./Flex.svelte";
    import { TreeItem } from "$lib/components";
    import { treeStore } from "$lib/stores/objects.svelte";
    import type { ITreeObject, ILink } from "$lib/interface";

    let objects: ITreeObject[] | null = $derived(treeStore.all.objects ?? []);
    let links: ILink[] | null = $derived(treeStore.all.links ?? []);
    
</script>

<Flex col>
    <TreeItem id={0} {objects} {links} />
</Flex>