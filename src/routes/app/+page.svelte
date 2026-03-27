<script lang="ts">
    import { SideBar, ContextMenu, Canvas, Modal, Notification } from "$lib/components";
    import { notificationStore } from "$lib/stores/notification.svelte";
    import { side } from "$lib/stores/other.svelte";

    let notifications = $derived(notificationStore.all);

</script>

<div class="flex size-screen">
    {#each side.v as {pos, width, main}, i}
        <SideBar {pos} {width} {main} {i} />
    {/each}
    <ContextMenu />
    <Canvas />
    <Modal show={true} />
    {#each notifications as {icon, title, type} (title)}
        <Notification {icon} {title} {type} />
    {/each}
</div>