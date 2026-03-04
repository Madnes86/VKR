<script lang="ts">
	import Flex from "./Flex.svelte";
    import Form from "./Form.svelte";
    import { objectsStore } from "$lib/stores/objects";

    let entityes = [];
    objectsStore.subscribe(v => entityes = [...v]);
    
    const icon = "entityes";
    const modificators: {name: string, onclick: () => void}[] = [{name: 'addUser', onclick: () => {alert('addUser')}}];
</script>

<Flex col>
    {#each entityes as entity}
        <Form {icon} text={entity.name} {modificators}/>
    {/each}
</Flex>