<script lang="ts">
    import { ButtonIcon, Input } from "$lib/components";
    import { contextStore } from "$lib/stores/context.svelte";
	import { objects } from "$lib/stores/objects.svelte";

    let x: number = $derived(contextStore.x - 15);
    let y: number = $derived(contextStore.y - 15);

    let items: string[] = $state([
        'test', 'test23423'
    ]);
    let input: HTMLInputElement | null = $state(null);
    let value: string = $state('');
    let sort: string[] = $derived(
        items.filter(item => item.includes(value))
    );
    let menu: HTMLInputElement| null = $state(null);
    let buttons: {name: string, onclick: () => void}[] = $state([
        {name: 'graph', onclick: clear}
    ]);

    $effect(() => {
        if (contextStore.isOpen) {
            input?.focus();
            value = '';
        }
    });
    function onclick(e: MouseEvent) {
        if (contextStore.isOpen && !menu.contains(e.target as Node)) {
            contextStore.close();
        }
    }
    // TODO: fix move object with push
    function create() {
        objects.add({
            id: Math.random(),
            name: 'test',
            parent: contextStore.data?.id ?? 0
        });
    }
    // TODo: fix remove element buildTree()
    function remove() {
        objects.remove(contextStore.data?.id);
    }
    function clear() {
        alert(value);
    }
</script>

<svelte:window {onclick} />

{#if contextStore.isOpen}
    <div bind:this={menu} style="left: {x}px; top: {y}px" class="flex items-center gap-2 fixed z-1000">
        <ButtonIcon name="plus" onclick={create} />
        <ButtonIcon name="cross" onclick={remove} stroke="red" />
        <!-- <Input bind:value={value} bind:ref={input} placeholder="search" />    -->
        <!-- {#each buttons as {name, onclick}}
            <ButtonIcon {name} {onclick} />
        {/each} -->
        <!-- {#if value.length != 0}
            {#if sort.length != 0}
                <div class="absolute top-10 left-12 p-1 border border-gray bg-gray-glass rounded-md">
                    {#each sort as item}
                        <div class="click hover:bg-gray px-1 cursor-pointer rounded-md">{item}</div>
                    {/each}
                </div>
            {:else}
                <p class="text-yellow text-sm absolute top-10 left-12">No result searching</p>
            {/if}
        {/if} -->
    </div>
{/if}
