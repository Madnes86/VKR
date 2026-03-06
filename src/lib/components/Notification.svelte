<script lang="ts">
    import { Icon } from "$lib/components";
	import { onDestroy } from "svelte";
	import { flip } from "svelte/animate";
	import { fade, fly } from "svelte/transition";

    let {
        icon,
        title,
        type = 'info',
        duration = 3_000,
        onClose
    } : {
        icon?: string;
        title?: string;
        type?: string;
        duration?: number;
        onClose?: () => void;
    } = $props();

    let visible = $state(true);
    let timeout: NodeJS.Timeout;
    let isHiding: boolean = $state(false);

    const color = {
        success: 'border-green-400',
        error: 'border-red',
        info: 'border-blue-400',
        warning: 'border-yellow'
    }

    timeout = setTimeout(() => {
        isHiding = true;
        setTimeout(() => {
            // visible = false;
            onClose?.();
        }, 300);
    }, duration);

    onDestroy(() => {
        clearTimeout(timeout);
    })

    function onclick() {
        visible = false;
        clearTimeout(timeout);
        setTimeout(() => {
            onClose?.();
        }, 300);
    }

</script>

{#if visible}
    <div class="{isHiding ? 'notification-hide' : 'notification-show'} {color[type] || 'bg-white'} z-4 border-l-3 flex gap-4 p-4 fixed bottom-4 right-4 items-center bg-gray-glass">
        <div class="size-5">
            <Icon name={icon} />
        </div>
        <h3 class="w-full">{title}</h3>
        <button {onclick} class="click hover:bg-gray rounded-sm p-2">
            <Icon name="cross" />
        </button>
    </div>
{/if}

<style>
    .notification-show {
        animation: slideIn 0.3s ease-out;
    }

    .notification-hide {
        animation: slideOut 0.3s ease-in forwards;
    }

    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
</style>