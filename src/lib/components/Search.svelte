<script lang="ts">
    import { searchStore } from "$lib/stores/search.svelte";
    import { Icon } from "$lib/components";

    let global: boolean = $state(true);
    let stroke = $derived(global ? '#FFF' : 'var(--color-accent)');
    let v: string = $state('');
    let category: string | null = $state(null);
    const placeholder = 'Search';

    function search() {
        searchStore.set(v, global);
    }
    function toggle() {
        global = !global;
    }
    function clear() {
        v = '';
        searchStore.set(v, global);
    }


</script>

    <div class="flex gap-2 items-center w-full p-2">
        {#snippet button(name: string, onclick: () => void, stroke?: string)}
            <button {onclick} class="click p-1.5 size-7 rounded-md hover:bg-gray">
                <Icon {name} {stroke} />
            </button>
        {/snippet}
        {@render button("global", toggle, stroke)}
        <input 
            bind:value={v} 
            {placeholder}
            type="text" 
            class="w-full text-lg p-0 border-none bg-transparent">
        {#if v.length > 2}
            {@render button("cross", clear)}
        {/if}
        {@render button("category", table)}
        {@render button("search", search)}
    </div>