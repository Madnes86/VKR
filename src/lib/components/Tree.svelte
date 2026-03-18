<script lang="ts">
	import Flex from "./Flex.svelte";
    import { TreeItem } from "$lib/components";
    import { objectsStore, type ITreeObject } from "$lib/stores/objects.svelte";

    let object: ITreeObject | null = null;
    objectsStore.subscribe(v => object = v);
    // console.log(object);
    
    const icon = "entityes";
    const modificators: {name: string, onclick: () => void}[] = [{name: 'addUser', onclick: () => {alert('addUser')}}];
</script>

<Flex col>
    <TreeItem objects={object?.objects} />
</Flex>