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
    <!-- Позиционирование (fixed/bottom/right) задаётся контейнером-стеком
         в +page.svelte, чтобы несколько уведомлений могли уживаться
         друг над другом, а не накладываться в одной точке. -->
    <div class="{isHiding ? 'hide' : 'show'} {color[type] || 'bg-white'} border-l-3 flex gap-4 p-4 items-center bg-gray-glass min-w-72 max-w-96 shadow-lg">
        <div class="size-5 shrink-0">
            <Icon name={icon} />
        </div>
        <h3 class="w-full">{title}</h3>
        <button {onclick} class="click hover:bg-gray rounded-sm p-2 shrink-0">
            <Icon name="cross" />
        </button>
    </div>
{/if}