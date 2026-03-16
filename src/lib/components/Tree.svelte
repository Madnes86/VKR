<script lang="ts">
	import Flex from "./Flex.svelte";
    import { TreeItem } from "$lib/components";
    import { objectsStore, type ITreeObject } from "$lib/stores/objects";

    let objects: ITreeObject[] = [];
    objectsStore.subscribe(v => objects = v);
    
    const icon = "entityes";
    const modificators: {name: string, onclick: () => void}[] = [{name: 'addUser', onclick: () => {alert('addUser')}}];
</script>

<Flex col>
    <TreeItem {objects} />
</Flex>