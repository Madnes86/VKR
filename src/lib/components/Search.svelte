<script lang="ts">
    import { searchStore } from "$lib/stores/search.svelte";
    import { Icon } from "$lib/components";
    import { objectValidation } from "$lib/functions/other";
    import { categoryes } from "$lib/mocs/categoryes";
    import { notificationStore } from "$lib/stores/notification.svelte";
    import type { ICategory } from "$lib/interface";
	import DropDownMore from "./DropDownMore.svelte";

    let v: string = $state('');
    let cats: ICategory[] = $state(categoryes);
    let global: boolean = $derived(cats[0].check);
    let stroke = $derived(global ? 'var(--color-accent)' : '#FFF');
    const placeholder = 'Search';

    function search() {
        const newV = objectValidation(v);

        if (3  > newV.length) return notificationStore.error('Не корректное значение поиска', 'error');
        if (newV.length > 64) return notificationStore.error('Не корректное значение поиска', 'error');

        const selected = cats.filter(c => c.check).map(({ name, check }) => ({ name, check }));
        console.log(selected);

        searchStore.set(newV, selected);
    }
    function clear() {
        v = '';
        const selected = cats.filter(c => c.check).map(({ name, check }) => ({ name, check }));
        searchStore.set(v, selected);
    }
    
</script>

    <div class="flex gap-2 items-center w-full p-2">
        {#snippet button(name: string, onclick: () => void, stroke?: string)}
            <button {onclick} aria-label={name} class="click p-1.5 size-7 rounded-md hover:bg-gray">
                <Icon {name} {stroke} />
            </button>
        {/snippet}
        {@render button("global", () => cats[0].check = !cats[0].check, stroke)}
        <input 
            bind:value={v} 
            {placeholder}
            type="text" 
            class="w-full text-lg p-0 border-none bg-transparent">
        {#if v.length > 2}
            {@render button("cross", clear)}
        {/if}
        <DropDownMore items={cats}>
            <Icon name="category" />
        </DropDownMore>
        {@render button("search", search)}
    </div>