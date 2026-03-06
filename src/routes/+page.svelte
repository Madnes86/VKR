<script lang="ts">
    import { SideBar, ContextMenu, Canvas } from "$lib/components";
    import { modalStore } from "$lib/stores/modal.svelte";
	import Modal from "$lib/components/Modal.svelte";
</script>

<div class="flex size-screen">
    <SideBar />
    <ContextMenu />
    <Canvas />
    <Modal show={true} />
</div>