<script lang="ts">
	import { fade } from "svelte/transition";
    import { Flex, Icon, Button } from "$lib/components";

    let {
        icon,
        text = $bindable(),
        validate,
        disabled = true,
        modificators
    } : {
        icon: string;
        text: string;
        validate?: (text: string) => string;
        disabled?: boolean;
        modificators?: {name: string, onclick: () => void}[];
    } = $props();

    let hover: boolean = $state(false);
    let state: 'error' | 'edit' | 'default' = $state('default'); // interface
    let active: boolean = $state(false);
    let error: string = $state('error');

    $effect(() => {
        if (state == 'edit' || state == 'error') {
            if (validate ? validate(text) : '') {
                error = validate ? validate(text) : ''
                state = 'error';
            } else if (text.length == 0) {
                error = 'length small';
                state = 'error';
            } else {
                error = '';
                state = 'edit';
            }
        }
    });

    let label = $derived.by(() => {
        if (state == 'error') {
            return 'red';
        } else if (active) {
            return '#835CFD';
        } else {
            return 'white';
        }
    });
    let check = $derived(state == 'error' ? 'red' : 'green');

    function switchState() {
        if (state == 'default') {
            state = 'edit';
        } else if (state == 'error') {
            return
        } else {
            state = 'default';
        }
    }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<Flex col className="items-start">
    <div 
        onmouseenter={() => hover = true} 
        onmouseleave={() => hover = false} 
        class={`${state == 'error' && 'outline outline-red-400'} flex rounded-md w-full items-center m-1`}
        class:bg-black={state == 'edit' || state == 'error'}
    >
        <Button {disabled} onclick={() => active = !active} className="p-1 flex w-full rounded-md gap-2 hover:bg-[#323232]">
            <div class="size-6">
                <Icon name={icon} stroke={label} />
            </div>
            {#if state == 'default'}
                <p class:text-[#835CFD]={active}>{text}</p>
            {:else if state == 'edit' || state == 'error'}
                <input 
                    type="text" 
                    bind:value={text} 
                    class={`${state == 'error' && ''} w-full focus:outline-none bg-transparent p-0 h-6 border-0`}
                    class:text-red-400={state == 'error'}
                >
            {/if}
        </Button>
    
        {#if hover || state == 'error'}
            {#snippet button(name: string, onclick: () => void, stroke?: string)}
                <button
                    transition:fade 
                    {onclick} 
                    class="click p-2 ml-1 rounded-md hover:bg-[#323232]"
                >
                    <Icon {name} {stroke} />
                </button>
            {/snippet}
            {#if state == 'default'}
                {@render button('edit', switchState)}
            {:else}
                {@render button('check', switchState, check)}
            {/if}
            {#if text.length > 4 && state != 'default'}
                {@render button('cross', switchState)}
            {/if}
            {#each modificators as {name, onclick} }
                {@render button(name, onclick)}
            {/each}
        {/if}
    </div>
    {#if state == 'error'}
        <p transition:fade class="px-2 text-xs text-red-400">{error}</p>
    {/if}
</Flex>