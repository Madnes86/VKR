<script lang="ts">
    import Alert from "./Alert.svelte";

    let alerts: {title: string, text: string, type: 'alert' | 'error'}[] = [
        {title: 'test', text: 'test', type: 'alert'},
        {title: 'test', text: 'test', type: 'error'},
    ];
    let show: number = $state(0);

</script>

{#each alerts as {title, text, type}, i}
    <Alert {title} {text} {type} show={show == i}/>
{/each}