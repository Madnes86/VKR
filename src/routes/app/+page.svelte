<script lang="ts">
    import { SideBar, ContextMenu, Canvas, Window } from "$lib/components";
	import Modal from "$lib/components/Modal.svelte";
	import Notification from "$lib/components/Notification.svelte";
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
    <!-- <SideBar pos="r" width={300} main={false} /> -->
    <Window />
    {#each notifications as {icon, title, type} (title)}
        <Notification {icon} {title} {type} />
    {/each}
</div>