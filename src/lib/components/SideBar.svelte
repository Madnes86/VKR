<script lang="ts">
    import { Tabs, Search, Tree, Entityes, Editor, Alerts, Settings } from "$lib/components";
    import { side } from "$lib/stores/other.svelte";

    const tabs: string[] = ['graph', 'entity', 'editor', 'alert', 'settings'];
    let {
        pos = 'r',
        width,
        main,
        i,
    } : {
        pos: 'rt' | 'rb' | 'lt' | 'lb' | 'r' | 'l'
        width: number
        main: boolean
        i: number
    } = $props();
    let right: boolean = $derived(pos === 'r');
    let posClass: string = $derived.by(() => {
        if (pos === 'l') return 'left-0';
        if (pos === 'r') return 'right-0';
        return 'left-0';
    });

    const sections = [Tree, Entityes, Editor, Alerts, Settings];
    let selectedTab: string = $state('graph');
    let ref: number | null = $state(null);
    let isDrag: boolean = $state(false);
    let show: boolean = $derived(ref > 800);

    const onmousedown = () => isDrag = true;
    const onmouseup   = () => isDrag = false;

    function onmousemove(e: MouseEvent) {
        if (isDrag) {
            const newWidth = e.clientX;
            if ( 240 < newWidth && newWidth < 600 ) {
                side.v[i].width = newWidth;
            }
        }
    }
</script>

<svelte:window {onmousemove} {onmouseup} bind:innerWidth={ref} />

{#if show}
    <div class="{posClass} {right ? 'flex-row-reverse' : 'flex-row'} flex h-screen z-1 absolute top-0 backdrop-blur-[2px]">
        <div style="width: {width}px" class="bg-gray-glass h-screen">
            {#if main}
                <Tabs {tabs} bind:selectedTab={selectedTab}/>
                {#if selectedTab !== 'settings'}
                    <Search />
                {/if}
                    {#each tabs as tab, i}
                        {#if selectedTab == tab}
                            <svelte:component this={sections[i]}/>
                        {/if}
                    {/each}
                {:else}
                    <svelte:component this={sections[1]}/>
                {/if}
            </div>
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <span {onmousedown} class="hover:bg-accent cursor-col-resize h-screen w-0.5 bg-gray"></span>
    </div>
{/if}