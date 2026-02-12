<script lang="ts">
	import Flex from "./Flex.svelte";
    import Icon from "./Icon.svelte";

    let {
        icon,
        text = $bindable(),
        validate,
        error = 'Error'
    } : {
        icon: string;
        text: string;
        validate?: () => boolean;
        error: string;
    } = $props();

    let hover: boolean = $state(false);
    let state: 'error' | 'edit' | 'default' = $state('default');

    function switchState() {
        if (state == 'default') {
            state = 'edit';
        } else if (state == 'error') {
            return
        } else {
            state = 'default';
        }
    }
    $effect(() => {
        // validate();
        if (text.length == 0) {
            error = 'length small';
            state = 'error';
        } else if (text.length >= 5) {
            error = 'length large';
            state = 'error';
        } else {
            state = 'edit';
        }

    });
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<Flex col className="items-start">
    <div onmouseenter={hover = true} onmouseleave={hover = false} class={`${state == 'error' && 'border border-red-400'} flex rounded-md w-full items-center m-1`}
        class:bg-black={state == 'edit' || state == 'error'}
    >
        <Flex className="click p-1 rounded-md gap-2 hover:bg-[#323232]">
            <Icon name={icon} stroke={state == 'error' ? 'red' : 'white'} />
            {#if state == 'default'}
                <p>{text}</p>
            {:else if state == 'edit' || state == 'error'}
                <input type="text" bind:value={text} class={`${state == 'error' && ''} focus:outline-none bg-transparent w-full p-0 h-6 border-0`}
                class:text-red-400={state == 'error'}
                >
            {/if}
        </Flex>
    
        {#if hover || state == 'error'}
            <button onclick={() => switchState()} class="click p-2 ml-1 rounded-md hover:bg-[#323232]">
                {#if state == 'default'}
                    <Icon name="edit" />
                {:else}
                    <Icon name="check" stroke={state == 'edit' ? 'green' : 'red'} />
                {/if}
            </button>
        {/if}
    </div>
    {#if state == 'error'}
        <p class="px-2 text-xs text-red-400">{error}</p>
    {/if}
</Flex>