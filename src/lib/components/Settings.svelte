<script lang="ts">
    import { Flex, User, Toggle } from "$lib/components";

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