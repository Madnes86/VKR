<script lang="ts">
    import { Icon } from "$lib/components";
	import { onDestroy } from "svelte";

    let {
        icon = "alert",
        title,
        type = 'info',
        duration = 3000,
        onClose
    } : {
        icon?: string;
        title?: string;
        type?: 'success' | 'error' | 'info' | 'warning';
        duration?: number;
        onClose?: () => void;
    } = $props();

    let visible = $state(true);
    let timeout: ReturnType<typeof setTimeout>;
    let isHiding: boolean = $state(false);

    const color = {
        success: 'border-green-400',
        error:   'border-red',
        info:    'border-blue-400',
        warning: 'border-yellow'
    }

    timeout = setTimeout(() => {
        onclick();
    }, duration);

    onDestroy(() => {
        clearTimeout(timeout);
    })

    function onclick() {
        isHiding = true
        clearTimeout(timeout);
        setTimeout(() => {
            visible = false;
            onClose?.();
        }, 300);
    }

</script>

{#if visible}
    <div class="{isHiding ? 'hide' : 'show'} {color[type] || 'bg-white'} z-4 border-l-3 flex gap-4 p-4 fixed bottom-4 right-4 items-center bg-gray-glass">
        <div class="size-5">
            <Icon name={icon} />
        </div>
        <h3 class="w-full">{title}</h3>
        <button {onclick} class="click hover:bg-gray rounded-sm p-2">
            <Icon name="cross" />
        </button>
    </div>
{/if}