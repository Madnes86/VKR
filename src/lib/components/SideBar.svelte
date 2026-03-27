<script lang="ts">
    import { Tabs, Search, Icon, Tree, Entityes, Editor, Alerts, Settings } from "$lib/components";
    import { side } from "$lib/stores/other.svelte";

    const tabs: string[] = ['graph', 'entity', 'editor', 'alert', 'settings'];
    const sections = [Tree, Entityes, Editor, Alerts, Settings];

    let {
        pos = 'r',
        width,
        main,
        i,
    } : {
        pos: 'r' | 'l'
        width: number
        main: boolean
        i: number
    } = $props();

    let selectedTab: string = $state('graph');
    let ref: number | null = $state(null);
    let isDrag: boolean = $state(false);
    let show: boolean = $state(true);
    let hover: boolean = $state(false);
    let right: boolean = $derived(pos === 'r');
    let posClass: string = $derived.by(() => {
        if (pos === 'l') return 'left-0';
        if (pos === 'r') return 'right-0';
        return 'left-0';
    });

    const onmousedown = () => isDrag = true;
    const onmouseup   = () => isDrag = false;

    function onmousemove(e: MouseEvent) {
        if (isDrag) {
            const newWidth = right ? ref - e.clientX : e.clientX;
            if ( 240 < newWidth && newWidth < 600 ) {
                side.update('width', newWidth, i);
            }
        }
    }
    function onclick() {
        side.remove();
    }
    function showing() {
        show = true;
        side.update('width', 300, i);
    }
    function closing() {
        show = false;
        side.update('width', 30, i);
    }
    
    const ondragleave = () => hover = false;
    const ondragover = (e: DragEvent) => {
        e.preventDefault();
        hover = true;
    };
    function ondrop(e: DragEvent) {
        e.preventDefault();
        const index = tabs.findIndex(i => i === e.dataTransfer?.getData("text/plain"));
        hover = false;
        side.add({pos: 'r', width: 300, main: false}, index);
    };
    $effect(() => {
        800 > ref ? closing() : showing();
    });
</script>

<svelte:window {onmousemove} {onmouseup} bind:innerWidth={ref} />

{#if show}
    <div class="{posClass} {right ? 'flex-row-reverse' : 'flex-row'} flex h-screen z-1 absolute top-0 backdrop-blur-xs">
        <div style="width: {width}px" class="bg-gray-glass h-screen">
            {#if main}
                <Tabs {tabs} bind:selectedTab={selectedTab}>
                    <button onclick={closing} class="rounded-sm p-1 hover:bg-gray">
                        <Icon name={right ? 'side-r-close' : 'side-l-close'} />
                    </button>
                </Tabs>
                {#if selectedTab !== 'settings'}
                    <Search />
                {/if}
                {#each tabs as tab, i}
                    {#if selectedTab == tab}
                        <svelte:component this={sections[i]}/>
                    {/if}
                {/each}
            {:else}
                <div>
                    <div class="flex gap-1 p-1 border-b-2 border-gray">
                        <button onclick={closing} class="click rounded-sm p-1 hover:bg-gray">
                            <Icon name={right ? 'side-r-close' : 'side-l-close'} />
                        </button>
                        <button {onclick} class="click rounded-sm p-1 hover:bg-gray">
                            <Icon name="remove-square" />
                        </button>
                    </div>
                    <svelte:component this={sections[side.i]}/>
                </div>
            {/if}
            </div>
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <span {onmousedown} class="hover:bg-accent cursor-col-resize h-screen w-0.5 bg-gray"></span>
    </div>
    {#if 2 > side.v.length}
        <div {ondrop} {ondragover} {ondragleave} class="{hover && 'bg-gray-glass'} {right ? 'left-0' : 'right-0'} fixed top-0 h-screen w-20 z-10"></div>
    {/if}
{:else}
    <div class="{posClass} p-1 flex z-1 absolute top-0 backdrop-blur-xs">
        <button onclick={showing} class="click rounded-sm p-1 hover:bg-gray">
            <Icon name={right ? 'side-r-open' : 'side-l-open'} />
        </button>
    </div>
{/if}