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
    // Canvas слушает wheel на window (зум диаграммы). Пока курсор внутри sidebar'а —
    // не даём событию всплыть, чтобы колесо прокручивало секцию, а не зумило диаграмму.
    const onwheelStop = (e: WheelEvent) => e.stopPropagation();
    function ondrop(e: DragEvent) {
        e.preventDefault();
        const index = tabs.findIndex(i => i === e.dataTransfer?.getData("text/plain"));
        hover = false;
        side.add({pos: right ? 'l' : 'r', width: 300, main: false}, index);
    };
    $effect(() => {
        800 > ref ? closing() : showing();
    });
</script>

<svelte:window {onmousemove} {onmouseup} bind:innerWidth={ref} />

{#if show}
    <div class="{posClass} {right ? 'flex-row-reverse' : 'flex-row'} flex h-screen z-1 absolute top-0 backdrop-blur-xs">
        <div style="width: {width}px" class="bg-gray-glass h-screen flex flex-col">
            {#if main}
                <Tabs {tabs} bind:selectedTab={selectedTab}>
                    <button onclick={closing} class="rounded-sm p-1 hover:bg-gray">
                        <Icon name={right ? 'side-r-close' : 'side-l-close'} />
                    </button>
                </Tabs>
                {#if selectedTab !== 'settings'}
                    <Search />
                {/if}
                <div class="flex-1 min-h-0 overflow-auto" onwheel={onwheelStop}>
                    {#each tabs as tab, i}
                        {#if selectedTab == tab}
                            <svelte:component this={sections[i]}/>
                        {/if}
                    {/each}
                </div>
            {:else}
                <div class="flex flex-col h-full">
                    <div class="flex gap-1 p-1 border-b-2 border-gray">
                        <button onclick={closing} class="click rounded-sm p-1 hover:bg-gray">
                            <Icon name={right ? 'side-r-close' : 'side-l-close'} />
                        </button>
                        <button {onclick} class="click rounded-sm p-1 hover:bg-gray">
                            <Icon name="remove-square" />
                        </button>
                    </div>
                    <div class="flex-1 min-h-0 overflow-auto" onwheel={onwheelStop}>
                        <svelte:component this={sections[side.i]}/>
                    </div>
                </div>
            {/if}
            </div>
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <span {onmousedown} class="hover:bg-accent cursor-col-resize h-screen w-0.5 bg-gray"></span>
    </div>
    {#if 2 > side.v.length}
        <div {ondrop} {ondragover} {ondragleave} class="{hover ? 'bg-gray-glass border-accent' : 'border-transparent'} {right ? 'left-0 border-r-2' : 'right-0 border-l-2'} border-dashed fixed top-0 h-screen w-40 z-10"></div>
    {/if}
{:else}
    <div class="{posClass} p-1 flex z-1 absolute top-0 backdrop-blur-xs">
        <button onclick={showing} class="click rounded-sm p-1 hover:bg-gray">
            <Icon name={right ? 'side-r-open' : 'side-l-open'} />
        </button>
    </div>
{/if}