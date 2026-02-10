<script>
    import Flex from "$lib/components/Flex.svelte";
    import Tabs from "$lib/components/Tabs.svelte";
    import Tree from "$lib/components/Tree.svelte";
    import Editor from "$lib/components/Editor.svelte";

    const tabs = ['graph', 'entity', 'editor', 'notification', 'settings'];
    const sections = [Tree, Editor];
    let selectedTab = 'graph';
</script>

<Flex col className="bg-[#32323265] w-80! h-screen">
    <Tabs {tabs} bind:selectedTab={selectedTab}/>
    {#each tabs as tab, i}
        {#if selectedTab == tab}
            <svelte:component this={sections[i]}/>
        {/if}
    {/each}
</Flex>