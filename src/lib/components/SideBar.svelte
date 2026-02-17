<script lang="ts">
    import { Flex, Tabs, Tree, Editor, Alerts, Settings } from "$lib/components";

    const tabs = ['graph', 'entity', 'editor', 'alert', 'settings'];
    const sections = [Tree, Tree, Editor, Alerts, Settings];
    let selectedTab = $state('graph');
    let width: number = $state(360);
    let isDrag = $state(false);

    const onmousedown = () => isDrag = true;
    const onmouseup   = () => isDrag = false;

    function onmousemove(event: MouseEvent) {
        if (isDrag) {
            const newWidth = event.clientX;
            if ( 240 < newWidth && newWidth < 600 ) {
                width = newWidth;
            }
        }
    }
</script>

<svelte:window {onmousemove} {onmouseup} />

<div class="flex h-screen">
    <Flex col style="width: {width}px" className="bg-gray-glass h-screen">
        <Tabs {tabs} bind:selectedTab={selectedTab}/>
        {#each tabs as tab, i}
            {#if selectedTab == tab}
                <!-- svelte-ignore svelte_component_deprecated -->
                <svelte:component this={sections[i]}/>
            {/if}
        {/each}
    </Flex>
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <span {onmousedown} class="hover:bg-accent cursor-col-resize h-screen w-0.5 bg-gray"></span>
</div>