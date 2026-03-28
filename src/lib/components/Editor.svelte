<script lang="ts">
    import { LightText, Name } from "$lib/components";
    import { getText } from "$lib/functions/parser";
	import { links } from "$lib/mocs/links";
    import { objects } from "$lib/mocs/objects";
    import { selectedStore, viewStore } from "$lib/stores/objects.svelte";

    const TEXT = 'тестовый текст что бы проверить как это работает! new';
    let text: string = $state(getText(objects));

    let ref: HTMLTextAreaElement | undefined = $state();
    
    $effect(() => {
        if (ref && text) {
            ref.style.height = 'auto'; 
            ref.style.height = ref.scrollHeight + 'px';
        }
    });

    const handleWordClick = (id: number) => {
        const data = `o + ${id}`;
        selectedStore.set('selected', data);
    };
    function hover(id: number) {
        const data = `o + ${id}`;
        selectedStore.set('hover', data);
    }
    function onmouseleave(id: number) {
        selectedStore.clear('hover');
    }
    
</script>

<div class="relative w-full font-mono text-base leading-relaxed">
    <textarea 
        bind:this={ref}
        bind:value={text}
        spellcheck="false"
        class="absolute inset-0 w-full h-full p-3 bg-zinc-950 text-transparent caret-accent resize-none outline-none border border-zinc-800 rounded-md whitespace-pre-wrap break-words z-10"
    ></textarea>

    <div class="absolute inset-0 p-3 whitespace-pre-wrap break- pointer-events-none z-20">
        {#each objects as {id, name, type, parent}, i}
            {#if name.trim().length > 0}

                <!-- svelte-ignore a11y_click_events_have_key_events -->
                <!-- svelte-ignore a11y_no_static_element_interactions -->
                <span
                    class="pointer-events-auto cursor-pointer px-1 -mx-1 text-zinc-400 hover:text-white hover:bg-accent rounded-sm transition-colors"
                    onmouseenter={() => hover(id)}
                    onmouseleave={() => onmouseleave(id)}
                    onclick={() => handleWordClick(id)}>
                    <LightText text={name} />
                </span>
                {#if i < objects.length - 1}
                    <span> </span> 
                {/if}
            {:else}
                {name}
            {/if}
        {/each}
    </div>
</div>


<style>
    /* Дополнительная калибровка для идеального совпадения */
    textarea {
        line-height: inherit;
        font-family: inherit;
    }
</style>