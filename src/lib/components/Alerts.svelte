<script lang="ts">
    import { Alert } from "$lib/components";
    import Button from "./Button.svelte";

    let alerts: {title: string, text: string, type: 'alert' | 'error'}[] = [
        {title: 'test', text: 'test', type: 'alert'},
        {title: 'test2', text: 'test', type: 'error'},
    ];
   
    let show: number | null = $state(1000);

    function toggle(i: number) {
        show = show === i ? null : i;
    }

</script>

{#each alerts as {title, text, type}, i (title)}
    <Button onclick={() => toggle(i)} className="w-full">
        <Alert {title} {text} {type} show={show === i} />
    </Button>
{/each}