<script lang="ts">
    import { Flex, Icon, Spacer } from "$lib/components";
    import { side } from "$lib/stores/other.svelte"; 
	import type { Snippet } from "svelte";

    let {
        tabs,
        selectedTab = $bindable(),
        children
    } : {
        tabs: string[]
        selectedTab?: string
        children: Snippet
    } = $props();

    function ondragstart(e: DragEvent, tab: string) {
        if (e.dataTransfer) {
            e.dataTransfer.setData("text/plain", tab);
            e.dataTransfer.effectAllowed = "move";
        }
    }
</script>

<Flex className="p-1 gap-2 border-gray">
    {#each tabs as tab, i}
        {#if side.i !== i}
            {#if tab == selectedTab}
                <div draggable="true" class="rounded-sm p-1 hover:bg-gray">
                    <Icon name={tab} stroke="#835CFD" />
                </div>
            {:else}
                <button onclick={() => selectedTab = tab} ondragstart={(e) => ondragstart(e, tab)} draggable="true" class="click rounded-sm p-1 hover:bg-gray">
                    <Icon name={tab} />
                </button>
            {/if}
        {/if}
    {/each}
    <Spacer />
    {@render children?.()}
</Flex>