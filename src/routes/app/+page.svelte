<script lang="ts">
	import { onMount } from 'svelte';
	import { SideBar, ContextMenu, Canvas, Modal, Notification } from '$lib/components';
	import { notificationStore } from '$lib/stores/notification.svelte';
	import { side } from '$lib/stores/other.svelte';
	import { projectStore } from '$lib/stores/project.svelte';
	import { bootstrapDiagram } from '$lib/stores/objects.svelte';
	import { userStore } from '$lib/stores/user.svelte';

	let notifications = $derived(notificationStore.all);

	onMount(() => {
		if (userStore.isAuthenticated) {
			void projectStore.load();
		}
		// Диаграмма всегда поднимается через bootstrap: server-first для
		// залогиненных, localStorage-fallback для гостей и при сетевых
		// сбоях. Без этого гость терял objects/links при перезагрузке.
		void bootstrapDiagram();
	});
</script>

<div class="size-screen flex">
	{#each side.v as { pos, width, main }, i}
		<SideBar {pos} {width} {main} {i} />
	{/each}
	<ContextMenu />
	<Canvas />
	<Modal show={true} />
	<!-- Стек уведомлений: контейнер закреплён за нижний правый угол.
         flex-col укладывает детей сверху вниз; новые приходят последними
         в массиве store-а, поэтому отображаются внизу, а контейнер
         растёт вверх — старые уведомления автоматически сдвигаются.
         Ключ — id (не title): два уведомления с одинаковым текстом
         не должны схлопываться в один DOM-узел. onClose удаляет
         запись из стора при клике на крестик или истечении таймера. -->
	<div class="pointer-events-none fixed right-4 bottom-4 z-4 flex flex-col items-end gap-2">
		{#each notifications as { icon, title, type, id, duration } (id)}
			<div class="pointer-events-auto">
				<Notification
					{icon}
					{title}
					{type}
					{duration}
					onClose={() => notificationStore.remove(id)}
				/>
			</div>
		{/each}
	</div>
</div>
