<script lang="ts">
	import { fade } from "svelte/transition";
    import { Flex, Icon, Button } from "$lib/components";

    let {
        icon,
        text = $bindable(),
        validate,
        disabled = true,
        onsave,
        modificators = [],
    } : {
        icon: string;
        text: string;
        validate?: (text: string) => string | null;
        disabled?: boolean;
        onsave?: (value: string) => void | boolean | Promise<void | boolean>;
        modificators?: {name: string, onclick: () => void}[];
    } = $props();

    let hover: boolean = $state(false);
    let state: 'error' | 'edit' | 'default' = $state('default');
    let active: boolean = $state(false);
    let error: string = $state('');
    let original: string = $state('');
    let saving: boolean = $state(false);

    $effect(() => {
        if (state == 'edit' || state == 'error') {
            const v = validate ? validate(text) : null;
            if (v) {
                error = v;
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
        if (state == 'error') return 'red';
        if (active) return '#835CFD';
        return 'white';
    });
    let check = $derived(state == 'error' ? 'red' : 'green');

    function enterEdit() {
        original = text;
        state = 'edit';
    }

    async function commit() {
        if (state == 'error' || saving) return;
        if (text !== original && onsave) {
            saving = true;
            try {
                const ok = await onsave(text);
                if (ok === false) { saving = false; return; }
            } catch {
                saving = false;
                return;
            }
            saving = false;
        }
        state = 'default';
    }

    function cancel() {
        text = original;
        error = '';
        state = 'default';
    }

    let dirty = $derived(state !== 'default' && text !== original);

    async function onInputKeydown(e: KeyboardEvent) {
        if (e.key === 'Enter') {
            e.preventDefault();
            await commit();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            cancel();
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
                <!-- svelte-ignore a11y_autofocus -->
                <input
                    type="text"
                    bind:value={text}
                    onkeydown={onInputKeydown}
                    autofocus
                    class={`${state == 'error' && ''} w-full focus:outline-none bg-transparent p-0 h-6 border-0`}
                    class:text-red-400={state == 'error'}
                >
            {/if}
        </Button>

        {#if hover || state == 'error' || state == 'edit'}
            {#snippet button(name: string, onclick: () => void, stroke?: string)}
                <button
                    transition:fade
                    {onclick}
                    disabled={saving}
                    class="click p-2 ml-1 rounded-md hover:bg-[#323232]"
                >
                    <Icon {name} {stroke} />
                </button>
            {/snippet}
            {#if state == 'default'}
                {@render button('edit', enterEdit)}
            {:else}
                {@render button('check', commit, check)}
                {#if dirty}
                    {@render button('cross', cancel)}
                {/if}
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
