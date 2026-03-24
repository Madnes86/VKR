<script lang="ts">
	import type { Snippet } from "svelte";
    import { Icon } from "$lib/components";

    let {
        children,
        items = $bindable()
    } : {
        children: Snippet;
        items: any[];
    } = $props();

    let show: boolean = $state(false);
    let ref: HTMLElement | null = $state(null);

    const toggle = () => show = !show;

    function onclick(e: MouseEvent) {
        if (!ref?.contains(e.target as Node)) show = false;
    }

</script>
<!-- TODO: add shadow later -->
<svelte:window {onclick} />

    <div bind:this={ref} class="relative">
        <button onclick={() => toggle()} class="click rounded-sm p-1 hover:bg-gray">
            {@render children()}
        </button>
        {#if show}
            <div aria-label="cats-menu" role="group" class="absolute z-3 rounded-sm bg-gray top-full left-0 p-1 flex flex-col">
                {#each items as item, i (i)}
                    <div class="flex gap-2 w-full items-center whitespace-nowrap p-1 select-none">
                        <input bind:checked={item.check} aria-label={item.name} type="checkbox" class="click size-3.5 text-accent rounded-xs border-none">
                        <button onclick={() => item.check = !item.check} class="click flex gap-1 items-center ">
                            <Icon name={item.icon} />
                            <p class="w-full text-sm">{item.name}</p>
                        </button>
                    </div>
                {/each}
            </div>
        {/if}
    </div>