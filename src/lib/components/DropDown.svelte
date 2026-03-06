<script lang="ts">
	import type { Snippet } from "svelte";


    let {
        items,
        selectedItem = $bindable(),
        children,
        className,
    } : {
        items: any[];
        selectedItem?: any;
        children: Snippet;
        className: string;
    } = $props();

    let open: boolean = $state(true);

    const onclick = () => open = !open

    function selecting(item: any) {
        selectedItem = item;
    }

</script>



<div class="relative {className}">
    <button {onclick}>
        {@render children()}
    </button>

    {#if open}
        <div class="p-2 flex flex-col gap-2 absolute top-10 left-0">  
            {#each items as item}
                {#if item != selectedItem}
                    <button onclick={() => selecting(item)} class="click px-1 rounded-sm hover:bg-gray">{item}</button>
                {/if}
            {/each}
        </div>
    {/if}
</div>
