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
        validate?: (text: string) => string;
        error: string;
    } = $props();

    let hover: boolean = $state(false);
    let state: 'error' | 'edit' | 'default' = $state('default');

    function switchState() {
        console.log(text.length);
        if (state == 'default') {
            state = 'edit';
        } else if (state == 'error') {
            return
        } else {
            state = 'default';
        }
    }
    $effect(() => {
        // const isValidate = validate ? validate(text) : '';
        if (validate(text)) {
            error = validate(text)
            state = 'error';
        } else if (text.length == 0) {
            error = 'length small';
            state = 'error';
        } else {
            error = '';
            state = 'edit';
        }

    });
    console.log(text.length);
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<Flex col className="items-start">
    <div onmouseenter={() => hover = true} onmouseleave={() => hover = false} class={`${state == 'error' && 'outline outline-red-400'} flex rounded-md w-full items-center m-1`}
        class:bg-black={state == 'edit' || state == 'error'}
    >
        <Flex className="click p-1 rounded-md gap-2 hover:bg-[#323232]">
            <div class="size-6">
                <Icon name={icon} stroke={state == 'error' ? 'red' : 'white'} />
            </div>
            {#if state == 'default'}
                <p>{text}</p>
            {:else if state == 'edit' || state == 'error'}
                <input type="text" bind:value={text} class={`${state == 'error' && ''} w-full focus:outline-none bg-transparent p-0 h-6 border-0`}
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
            {#if text.length > 0 && state != 'default'}
                <button onclick={() => text = ''} class="click p-2 ml-1 rounded-md hover:bg-[#323232]">
                    <Icon name="cross" />
                </button>
            {/if}
        {/if}
    </div>
    {#if state == 'error'}
        <p class="px-2 text-xs text-red-400">{error}</p>
    {/if}
</Flex>