<script lang="ts">
    import { ButtonIcon, Input } from "$lib/components";

    let show: boolean = $state(false);

    let items: string[] = $state([
        'test', 'test23423'
    ]);
    let input: HTMLInputElement | null = $state(null);
    let value: string = $state('');
    let x: number = $state(0);
    let y: number = $state(0);
    let sort: string[] = $derived(
        items.filter(item => item.includes(value))
    );
    let menu: HTMLInputElement| null = $state(null);
    let buttons: {name: string, onclick: () => void}[] = $state([
        {name: 'graph', onclick: clear}
    ]);

    $effect(() => {
        if (show) {
            input?.focus();
        }
    })

    function oncontextmenu(event: MouseEvent) {
        event.preventDefault();
        x = event.clientX - 16;
        y = event.clientY - 16;
        show = !show;
    }
    function onclick(event: MouseEvent) {
        if (show && !menu.contains(event.target as Node)) {
            show = false;
        }
    }
    function clear() {
        alert(value);
    }

</script>

<svelte:window {oncontextmenu} {onclick}/>

{#if show}
    <div bind:this={menu} style="left: {x}px; top: {y}px" class="flex items-center gap-2 w-90! h-10 absolute">
        <ButtonIcon name="link" onclick={clear}/>
        <Input bind:value={value} bind:ref={input} placeholder="search" />   
        {#each buttons as {name, onclick}}
            <ButtonIcon {name} {onclick} />
        {/each}
        {#if value.length != 0}
            {#if sort.length != 0}
                <div class="absolute top-10 left-12 p-1 border border-gray bg-gray-glass rounded-md">
                    {#each sort as item}
                        <div class="click hover:bg-gray px-1 cursor-pointer rounded-md">{item}</div>
                    {/each}
                </div>
            {:else}
                <p class="text-yellow text-sm absolute top-10 left-12">No result searching</p>
            {/if}
        {/if}
    </div>
{/if}
