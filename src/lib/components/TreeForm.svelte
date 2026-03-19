<script lang="ts">
    import { Icon } from "$lib/components";
    import { selectedStore } from "$lib/stores/objects.svelte";

    let {
        id,
        name,
        text,
    } : {
        id: number
        name: string;
        text: string;
    } = $props();

    let selO: boolean = $derived(selectedStore.selO == id);
    let hoverO: boolean = $derived(selectedStore.hoverO == id);
    let hover: boolean = $state(false);
    let state: boolean = $state(true);

    function onmouseenter() {
        hover = true;
        selectedStore.set("hoverO", id);
    }
    function onmouseleave() {
        hover = false;
        selectedStore.clear('hoverO');
    }

    function onclick() {
        selectedStore.set("selO", id)
    }
    // function ondblclick(e: MouseEvent) {
    //     e.stopPropagation();
    //     selectedStore.set(id);
    // }
    // function selecting(e: MouseEvent) {
    //     e.stopPropagation();
    //     selectedStore.set(id);
    // }

</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div {onmouseenter} {onmouseleave} class={`${selO && 'border-accent border'} ${hoverO && 'outline-accent outline-1'} m-1 rounded-sm flex gap-2 w-full`}>
    <button {onclick} class="click flex gap-2 p-1 items-center w-full">
        <Icon {name} />
        {#if state}
            <p>{text}</p>
        {:else}
            <input bind:value={text} type="text">
        {/if}
    </button>
    {#if hover}
        <button class="click p-1 hover:bg-gray rounded-sm">
            <Icon name="edit" />
        </button>
    {/if}
</div>