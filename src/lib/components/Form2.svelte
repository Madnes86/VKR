<script lang="ts">
    import { Icon } from "$lib/components";

    let {
        value = $bindable(),
        icon,
        label,
        iType = "text",
        validate,
    } : {
        value: string;
        icon: string;
        label?: string;
        iType?: string; 
        validate?: (v: string) => string | null;
    } = $props();

    let show: boolean = $state(false);

    const clear = () => value = '';

    let type: any = $derived(
        iType == 'password' ? (show ? 'text' : 'password') : iType
    );
    function toggleType() {
        show = !show;
    }

    let error = $derived(validate ? validate(value) : null);

</script>

<div class="flex flex-col gap-2 w-full items-start">
    <h3>{label}</h3>
    <div class="flex w-full gap-2 items-center rounded-xl p-2 bg-black">
        <Icon name={icon} />
        <input bind:value={value} {type} class="focus:outline-none w-full bg-transparent p-0 h-6 border-0">

        {#if value.length > 3}
            <button onclick={clear} class="click hover:bg-gray p-1 rounded-sm">
                <Icon name="cross" />
            </button>
        {/if}
        {#if iType == 'password' && value.length > 0}
            <button onclick={toggleType} class="click p-1 rounded-sm hover:bg-gray">
                {#if type == 'password'}
                    <Icon name="show" />
                {:else}
                    <Icon name="eyeOff" />
                {/if}
            </button>
        {/if}
    </div>
    {#if error && error.length > 0}
        <p class="text-red text-sm">{error}</p>
    {/if}
</div>

