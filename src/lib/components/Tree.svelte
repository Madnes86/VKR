<script lang="ts">
	import Entity from "./Entity.svelte";
	import Flex from "./Flex.svelte";

    const entityes: {name: string, type: 'entity' | 'entityes' | 'optional'}[] = [
        { name: "test", type: "optional" },
        { name: "test2", type: "entityes"},
        { name: "test3", type: "entityes"}
    ];
    let selected = entityes[0];
</script>

<Flex col>
    {#each entityes as {name, type}}
        <Entity {name} {type}/>
    {/each}
</Flex>