<script lang="ts">
    import Flex from "./Flex.svelte";
    import Icon from "./Icon.svelte";

    let {
        tabs,
        selectedTab = $bindable()
    } : {
        tabs: string[]
        selectedTab?: any
    } = $props();
</script>

<Flex className="p-2 gap-3 border-b-2 border-[#323232]">
    {#each tabs as tab}
        {#if tab == selectedTab}
            <Icon name={tab} stroke="#835CFD" className="cursor-pointer"/>
        {:else}
            <button onclick={() => selectedTab = tab} class="click">
                <Icon name={tab} className="cursor-pointer"/>
            </button>
        {/if}
    {/each}
</Flex>