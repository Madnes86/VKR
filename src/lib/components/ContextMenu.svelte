<script lang="ts">
    import { Icon } from "$lib/components";
    import { contextStore } from "$lib/stores/context.svelte";
	import { objects } from "$lib/stores/objects.svelte";

    let x: number = $derived(contextStore.x - 15);
    let y: number = $derived(contextStore.y - 15);
    let menu: HTMLInputElement| null = $state(null);
    let id = $derived(contextStore.data.id);
    let o = $derived(objects.get(id));
    let type = $derived(o.type);

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
            type: 'default',
            parent: contextStore.data?.id ?? 0
        });
    }
    const defaultType = () => objects.updateType(id, 'default');
    const interfaceType = () => objects.updateType(id, 'interface');
    const optionalType = () => objects.updateType(id, 'optional');
    const up = () => objects.up(id);
    const down = () => objects.down(id);
    const remove = () => objects.remove(id);
</script>

<svelte:window {onclick} />

{#snippet button(name: string, text: string, onclick: () => void, color?: string)}
    <button {onclick} class="flex gap-2 p-1 click hover:bg-black w-full rounded-sm">
        <Icon {name} stroke={color} />
        <p style="color: {color}">{text}</p>
    </button>
{/snippet}

{#if contextStore.isOpen}
    <div bind:this={menu} style="left: {x}px; top: {y}px" class="flex items-start border border-white flex-col gap-2 fixed p-2 rounded-lg backdrop-blur-[4px] bg-gray-glass z-1000">
        {@render button('add', 'Add object', create)}
        {#if id > 0}
            {#if type !== 'default'}
                {@render button('object', 'default type', defaultType)}
            {/if}
            {#if type !== 'interface'}
                {@render button('interface', 'interface type', interfaceType)}
            {/if}
            {#if type !== 'optional'}
                {@render button('optional', 'optonal type', optionalType)}
            {/if}
            {@render button('up', 'up object', up)}
            {@render button('down', 'down object', down)}
            {@render button('delete', 'remove', remove, 'red')}
        {/if}
    </div>
{/if}
