<script lang="ts">
    import { Icon } from "$lib/components";

    let {
        value = $bindable(),
        icon,
        type = "text",
    } : {
        value: string;
        icon: string;
        type?: string; 
    } = $props();

    let error: string = $state('');
    const clear = () => value = '';

</script>

<div class="flex flex-col gap-2 w-full">
    <div class="flex gap-2 items-center rounded-xl p-2 bg-black">
        <Icon name={icon} />
        <input bind:value={value} {type} class="focus:outline-none w-full bg-transparent p-0 h-6 border-0">

        {#if value.length > 3}
            <button onclick={clear} class="click hover:bg-gray p-1 rounded-sm">
                <Icon name="cross" />
            </button>
        {/if}
    </div>
    {#if error.length > 0}
        <p>{error}</p>
    {/if}
</div>

