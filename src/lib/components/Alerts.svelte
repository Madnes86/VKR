<script lang="ts">
    import { Alert, Button } from "$lib/components";
    import { alerts } from "$lib/stores/alert.svelte";
    import { searchStore } from "$lib/stores/search.svelte";

    let query = $derived(searchStore.get());
    let filterAlerts = $derived.by(() => {
        const all = alerts.all

        return all.filter(e => {
            if (e.title.includes(query)) return e;
        });
    });
   
    let show: number | null = $state(1000);

    function toggle(i: number) {
        show = show === i ? null : i;
    }

</script>

{#each filterAlerts as {title, text, type}, i (title)}
    <Button onclick={() => toggle(i)} className="w-full">
        <Alert {title} {text} {type} show={show === i} {query} />
    </Button>
{/each}