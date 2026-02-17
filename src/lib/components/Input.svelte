<script lang="ts">
    import { Flex, Button, Icon } from "$lib/components";

    let {
        value = $bindable(),
        placeholder,
        className,
        ref = $bindable(),
    } : {
        value: string;
        placeholder?: string;
        className?: string;
        ref?: HTMLInputElement;
    } = $props();

    const clear = () => value = '';

</script>

<Flex className="border w- border-gray bg-gray-glass rounded-full">
    <input bind:this={ref} {placeholder} bind:value={value} type="text" style="background-color: transparent;" class={`${className} rounded-full border-none w-full px-3 py-0.5`}>

    {#if 2 < value.length}
        <Button onclick={clear} className="p-1.5">
            <Icon name="cross" />
        </Button>
    {/if}
</Flex>