<script lang="ts">

    let {
        text,
        query
    } : {
        text: string;
        query: string;
    } = $props();

    let match = $derived.by(() => {
        const n = text.toLowerCase();
        if (!query || !n.includes(query)) return { start: -1, end: -1 };
        const start = n.indexOf(query);
        return { start, end: start + query.length };
    });

</script>
<!-- TODO: md use global searchStore? -->

    <p>
        {#each text as symbol, i}
            {@const isMatch = i >= match.start && i < match.end}
            {@const isFirst = i === match.start}
            {@const isLast  = i === match.end - 1}
            <span class="{isMatch && 'bg-accent is-match'} {isFirst && 'rounded-l'} {isLast && 'rounded-r'}">{symbol}</span>
        {/each}
    </p>


<style>
    /* 0.2em — это примерно 20% от размера шрифта. 
       Если шрифт 16px, скругление будет ~3px. 
       Если шрифт 40px, скругление станет 8px. */
    .rounded-l {
        border-top-left-radius: 0.25em;
        border-bottom-left-radius: 0.25em;
    }
    .rounded-r {
        border-top-right-radius: 0.25em;
        border-bottom-right-radius: 0.25em;
    }
    .is-match {
        /* Добавляем небольшие отрицательные отступы, чтобы фон букв сливался */
        margin: 0 -0.5px; 
    }
</style>
