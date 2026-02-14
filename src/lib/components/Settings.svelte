<script lang="ts">
	import Flex from "./Flex.svelte";
	import User from "./User.svelte";
    import Toggle from "./Toggle.svelte";

    let toggles: {power: boolean, text: string}[] = [
        {power: false, text: 'Hints'},
        {power: true, text: 'Display command cursors'},
        {power: true, text: 'Play audio'}
    ];
</script>

<Flex col className="p-2">
    <User />
    {#each toggles as {power, text}}
        <Toggle {power} {text} />
    {/each}
</Flex>