<script lang="ts">
    import { searchStore } from "$lib/stores/search.svelte";
    // TODO: remove name Store;

    let {
        text,
    } : {
        text: string;
    } = $props();

    let query: string = $derived(searchStore.get());

    let match = $derived.by(() => {
        const n = text.toLowerCase();
        if (!query || !n.includes(query)) return { start: -1, end: -1 };
        const start = n.indexOf(query);
        return { start, end: start + query.length };
    });

</script>
<!-- TODO: md use global searchStore? -->
<!-- TODO: styles migration -->

    <span class="inline">
        {#each text as symbol, i}
            {@const isMatch = i >= match.start && i < match.end}
            {@const isFirst = i === match.start}
            {@const isLast  = i === match.end - 1}
            <span class="{isMatch && 'bg-accent is-match'} {isFirst && 'rounded-l'} {isLast && 'rounded-r'}">{symbol}</span>
        {/each}
    </span>


<style>
    .rounded-l {
        border-top-left-radius: 0.25em;
        border-bottom-left-radius: 0.25em;
    }
    .rounded-r {
        border-top-right-radius: 0.25em;
        border-bottom-right-radius: 0.25em;
    }
    .is-match {
        margin: 0 -0.5px; 
    }
</style>
