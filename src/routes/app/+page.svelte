<script lang="ts">
    import { SideBar, ContextMenu, Canvas, Window } from "$lib/components";
	import Modal from "$lib/components/Modal.svelte";
	import Notification from "$lib/components/Notification.svelte";
    import { notificationStore } from "$lib/stores/notification.svelte";

    let notifications = $derived(notificationStore.all);
</script>

<div class="flex size-screen">
    <SideBar pos="r" />
    <ContextMenu />
    <Canvas />
    <Modal show={true} />
    <SideBar pos="l" />
    <Window />
    {#each notifications as {icon, title, type} (title)}
        <Notification {icon} {title} {type} />
    {/each}
</div>