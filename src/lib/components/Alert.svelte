<script lang="ts">
	import { fly } from "svelte/transition";
    import { Button, Flex, Icon, Spacer } from "$lib/components";

    let {
        title,
        text,
        type,
        show = false,
        query,
    } : {
        title: string;
        text:  string;
        type: 'alert' | 'error';
        show: boolean;
        query: string;
    } = $props();

    let hover: boolean = $state(false);
    let color: string = $derived(type == 'error' ? 'text-red' : 'text-yellow');
    let glass: string = $derived(type == 'error' ? 'bg-red-glass' : 'bg-yellow-glass')
    let stroke: string = $derived(type == 'error' ? 'red' : 'yellow');
    let bg: string = $derived(type == 'error' ? 'bg-red text-gray' : 'bg-yellow text-gray');
    let match = $derived.by(() => {
        const n = title.toLowerCase();
        if (!query || !n.includes(query)) return { start: -1, end: -1 };
        const start = n.indexOf(query);
        return { start, end: start + query.length };
    });

    const goError = () => alert();

</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div onmouseenter={() => hover = true} onmouseleave={() => hover = false} class="w-full">
    <Flex className={`${hover ? bg : show ? bg : color} p-1 w-full flex items-center`}>
        <Icon name="alert" stroke={hover ? '#323232' : show ? '#323232' : stroke} />
        <h3 class={`${hover ? '' : show ? 'text-gray' : color} p-1 whitespace-nowrap`}>
            <!-- TODO: create component -->
            {#each title as symbol, i}
                {@const isMatch = i >= match.start && i < match.end}
                {@const isFirst = i === match.start}
                {@const isLast  = i === match.end - 1}
                <span class="{isMatch && 'bg-accent'} {isFirst && 'rounded-l-xs'} {isLast && 'rounded-r-xs'}">{symbol}</span>
            {/each}
        </h3>
        <Spacer />
        <Button onclick={goError} className="p-1 hover:bg-gray hover:text-white rounded-md">
            <Icon name="forward" />
        </Button>
    </Flex>
    {#if show}
        <p transition:fly class={`${show ? glass : glass} ${color} w-full text-start p-3`}>{text}</p>
    {/if}
</div>