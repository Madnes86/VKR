<script lang="ts">
    import { Flex, Icon } from "$lib/components";

    let {
        tabs,
        selectedTab = $bindable()
    } : {
        tabs: string[]
        selectedTab?: string
    } = $props();
</script>

<Flex className="p-1 gap-2 border-gray">
    {#each tabs as tab}
        {#if tab == selectedTab}
            <div class="rounded-sm p-1 hover:bg-gray">
                <Icon name={tab} stroke="#835CFD" />
            </div>
        {:else}
            <button onclick={() => selectedTab = tab} class="click rounded-sm p-1 hover:bg-gray">
                <Icon name={tab} />
            </button>
        {/if}
    {/each}
</Flex>