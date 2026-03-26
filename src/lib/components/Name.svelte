<script lang="ts">
    import { Icon, LightText } from "$lib/components";
    import { searchStore } from "$lib/stores/search.svelte";

    let {
        name,
        size,
    } : {
        name: string;
        size: number;
    } = $props();

    let hover: boolean = $state(false);
    let read:  boolean = $state(false);
    let query: string = $derived(searchStore.get());

    const onmouseenter = () => hover = true;
    const onmouseleave = () => hover = false;

    async function onkeydown(e: KeyboardEvent) {
        if (e.key === 'Enter') {
            if (read) read = false;
        }
    }
    function toggle(e: MouseEvent) {
        e.stopPropagation();
        e.preventDefault();
        read = !read;
    }

</script>


    <div 
        {onmouseenter} 
        {onmouseleave}
        role="presentation"
        class="flex left-1/2 -translate-x-1/2 text-center absolute bottom-full text-border">
        <div>
            {#if read}
                    <input 
                    autofocus
                    {onkeydown} 
                    bind:value={name} 
                    onblur={() => read = false}
                    maxlength="18" 
                    style="font-size: {size / 5}px; height: {size / 4}px; line-height: {size / 4}px; width: {name.length + 1}ch" 
                    type="text" 
                    name="" 
                    id="" 
                    class="p-0 border-none left-1/2 -translate-x-1/2 text-center absolute bottom-full bg-transparent text-border">
            {:else}
                <button 
                    onmousedown={(e) => toggle(e)} 
                    style="font-size: {size / 5}px; height: {size / 4}px; line-height: {size / 4}px;" 
                    class="click whitespace-nowrap select-none">
                    <LightText text={name} />
                </button>
                {#if hover}
                    <button onmousedown={(e) => toggle(e)} style="width: {size / 5}px; height: {size / 5}px" class="click absolute top-1/2 left-full -translate-y-1/2">
                        {#if read}
                            <Icon name="check" stroke="green" />
                        {:else}
                            <Icon name="edit" />
                        {/if}
                    </button>
                {/if}
            {/if}
        </div>
    </div>