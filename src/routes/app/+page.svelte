<script lang="ts">
    import { onMount } from "svelte";
    import { SideBar, ContextMenu, Canvas, Modal, Notification } from "$lib/components";
    import { notificationStore } from "$lib/stores/notification.svelte";
    import { side } from "$lib/stores/other.svelte";
    import { projectStore } from "$lib/stores/project.svelte";
    import { userStore } from "$lib/stores/user.svelte";

    let notifications = $derived(notificationStore.all);

    onMount(() => {
        if (userStore.isAuthenticated) {
            void projectStore.load();
        }
    });
</script>

<div class="flex size-screen">
    {#each side.v as {pos, width, main}, i}
        <SideBar {pos} {width} {main} {i} />
    {/each}
    <ContextMenu />
    <Canvas />
    <Modal show={true} />
    <!-- Стек уведомлений: контейнер закреплён за нижний правый угол.
         flex-col укладывает детей сверху вниз; новые приходят последними
         в массиве store-а, поэтому отображаются внизу, а контейнер
         растёт вверх — старые уведомления автоматически сдвигаются. -->
    <div class="fixed bottom-4 right-4 z-4 flex flex-col gap-2 items-end pointer-events-none">
        {#each notifications as {icon, title, type} (title)}
            <div class="pointer-events-auto">
                <Notification {icon} {title} {type} />
            </div>
        {/each}
    </div>
</div>