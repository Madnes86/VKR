<script lang="ts">
    import { Flex, Tabs, Tree, Editor, Alerts, Settings } from "$lib/components";

    const tabs: string[] = ['graph', 'entity', 'editor', 'alert', 'settings'];
    const sections = [Tree, Tree, Editor, Alerts, Settings];
    let selectedTab: string = $state('graph');
    let ref: number | null = $state(null);
    let width: number = $state(350);
    let isDrag: boolean = $state(false);
    let show: boolean = $derived(ref > 800);

    const onmousedown = () => isDrag = true;
    const onmouseup   = () => isDrag = false;

    function onmousemove(e: MouseEvent) {
        if (isDrag) {
            const newWidth = e.clientX;
            if ( 240 < newWidth && newWidth < 600 ) {
                width = newWidth;
            }
        }
    }
</script>

<svelte:window {onmousemove} {onmouseup} bind:innerWidth={ref} />

{#if show}
    <div class="flex h-screen z-1 absolute top-0 left-0 backdrop-blur-[2px]">
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
{/if}