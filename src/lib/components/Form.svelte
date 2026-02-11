<script lang="ts">
	import Flex from "./Flex.svelte";
    import Icon from "./Icon.svelte";

    let {
        icon,
        text
    } : {
        icon: string;
        text: string;
    } = $props();

    let hover: boolean = $state(true);
    let state: 'error' | 'edit' | 'default' = $state('default');

    function switchState() {
        if (state == 'default') {
            state = 'edit';
        } else {
            state = 'default';
        }
    }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div onmouseenter={hover = true} onmouseleave={hover = false} class="flex w-full items-center gap-2 p-1">
    <Flex className="click px-1 h- rounded-sm gap-2 hover:bg-[#323232]">
        <Icon name={icon} />
        {#if state == 'default'}
            <p>{text}</p>
        {:else if state == 'edit'}
            <input type="text" bind:value={text} class="bg-transparent w-full h-6 border-0">
        {/if}
    </Flex>

    {#if hover}
        <button onclick={() => switchState()} class="click p-1 rounded-sm hover:bg-[#323232]">
            <Icon name="edit" />
        </button>
    {/if}
    {#if state == 'edit'}
        <button onclick={() => switchState()} class="click p-1 rounded-sm hover:bg-[#323232]">
            <Icon name="check" />
        </button>
    {/if}
</div>