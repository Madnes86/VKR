<script lang="ts">
	import Flex from "./Flex.svelte";
    import Form from "./Form.svelte";

    const entityes: {text: string, icon: 'entity' | 'entityes' | 'optional'}[] = [
        { text: "test", icon: "optional"},
        { text: "test2", icon: "entityes"},
        { text: "test3", icon: "entityes"}
    ];
    const modificators: {name: string, onclick: () => void}[] = [{name: 'addUser', onclick: () => {alert('addUser')}}];
</script>

<Flex col>
    {#each entityes as {text, icon}}
        <Form {icon} {text} {modificators}/>
    {/each}
</Flex>