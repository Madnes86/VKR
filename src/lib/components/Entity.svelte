<script lang="ts">
	import Flex from "./Flex.svelte";
	import Icon from "./Icon.svelte";
    import Spacer from "./Spacer.svelte";

    let {
        name,
        type,
        color = '#FFF'
    } : {
        name: string
        type: 'entity' | 'entityes' | 'optional'
        color?: string
    } = $props();

    let hover: boolean = $state(false);
    let selected: boolean = $state(false);
</script>
<!-- svelte-ignore a11y_no_static_element_interactions -->
 <div draggable="true" onmouseenter={hover = true} onmouseleave={hover = false} class="flex w-full p-1 gap-1">
     <button 
         onclick={selected = !selected}
         class="click flex w-full! items-center gap-1 px-1 rounded-sm hover:bg-[#323232]">
         <Icon name={type} stroke={selected ? '#835CFD' : '#FFF'} />
         <h3 class:text-[#835CFD]={selected}>{name}</h3>
    </button>
    {#if hover}
        <button class="hover:bg-[#323232] click px-1 rounded-sm">
            <Icon name="addUser" />
        </button>
    {/if}

 </div>