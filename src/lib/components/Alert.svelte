<script lang="ts">
	import Button from "./Button.svelte";
    import Flex from "./Flex.svelte";
    import Icon from "./Icon.svelte";

    let {
        title,
        text,
        type,
        show = false
    } : {
        title: string;
        text:  string;
        type: 'alert' | 'error';
        show: boolean;
    } = $props();

    let hover: boolean = $state(false);
    // let show: boolean = $state(false);
    let color: string = $derived(type == 'error' ? 'text-red' : 'text-yellow');
    let glass: string = $derived(type == 'error' ? 'bg-red-glass' : 'bg-yellow-glass')
    let stroke: string = $derived(type == 'error' ? 'red' : 'yellow');
    let bg: string = $derived(type == 'error' ? 'bg-red text-gray' : 'bg-yellow text-gray');

    const showing = () => show = !show;

</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div onmouseenter={() => hover = true} onmouseleave={() => hover = false} class="w-full">

    <Flex col>
        <Button onclick={showing} className={`${hover ? bg : show ? bg : color} p-1 w-full flex items-center`}>
            <Icon name="alert" stroke={hover ? '#323232' : show ? '#323232' : stroke} />
            <h3 class={`${hover ? bg : show ? bg : color} p-1`}>title</h3>
        </Button>
        {#if show}
            <p class={`${show ? glass : glass} ${color} w-full p-3`}>text</p>
        {/if}
    </Flex>
</div>