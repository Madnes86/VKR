<script lang="ts">
    import { Icon } from "$lib/components";
    import { selectedStore, viewStore } from "$lib/stores/objects.svelte";

    let {
        id,
        name,
        text,
        type,
    } : {
        id: number
        name: string;
        text: string;
        type: 'o' | 'l';
    } = $props();

    let selO: boolean = $derived(selectedStore.selO == id);
    let hoverO: boolean = $derived(selectedStore.hoverO == id);
    let hover: boolean = $state(false);
    let state: boolean = $state(true);

    function onmouseenter() {
        hover = true;
        if (type === 'o') {
            selectedStore.set("hoverO", id);
        } else {
            selectedStore.set("hoverL", id);
        }
    }
    function onmouseleave() {
        hover = false;
        if (type === 'l') {
            selectedStore.clear('hoverO');
        } else {
            selectedStore.clear('hoverL');
        }
    }

    function onclick() {
        if (type === 'o') {
            selectedStore.set("selO", id);
        } else {
            selectedStore.set("selL", id);
        }
    }
    function ondblclick(e: MouseEvent) {
        if (type === 'l') return;
        e.stopPropagation();
        viewStore.set(id);
    }

</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div {ondblclick} {onmouseenter} {onmouseleave} class={`${selO && 'border-accent border'} ${hoverO && 'outline-accent outline-1'} m-1 rounded-sm flex gap-2 w-full`}>
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