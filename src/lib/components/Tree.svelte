<script lang="ts">
	import Flex from "./Flex.svelte";
    import { TreeItem } from "$lib/components";
    import { objectsStore, type ILink, type ITreeObject } from "$lib/stores/objects.svelte";

    let objects: ITreeObject | null = null;
    let links: ILink | null = null;
    objectsStore.subscribe(v => {
        objects = v?.objects;
        links = v?.links;
    });
    
</script>

<Flex col>
    <TreeItem {objects} {links} />
</Flex>