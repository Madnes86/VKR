<script>
    import Flex from "$lib/components/Flex.svelte";
    import Tabs from "$lib/components/Tabs.svelte";
    import Graph from "$lib/components/Graph.svelte";

    const tabs = ['graph', 'entity', 'editor', 'notification', 'settings']
</script>

<Flex col className="bg-[#32323265]">
    <Tabs {tabs} selectedTab="editor"/>
    <Graph />
</Flex>