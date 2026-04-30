<script lang="ts">
	import { Icon } from '$lib/components';
	import GlobalEditor from '$lib/components/GlobalEditor.svelte';
	import GlobalCanvas from '$lib/components/GlobalCanvas.svelte';
	import { i18n } from '$lib/i18n';

	let collapsed: 'graph' | 'editor' | null = $state(null);

	function toggle(side: 'graph' | 'editor') {
		collapsed = collapsed === side ? null : side;
	}

	let graphClass = $derived(
		collapsed === 'graph' ? 'w-10' : collapsed === 'editor' ? 'w-full' : 'w-1/2'
	);
	let editorClass = $derived(
		collapsed === 'editor' ? 'w-10' : collapsed === 'graph' ? 'w-full' : 'w-1/2'
	);
</script>

<div class="flex h-screen w-screen">
	<section
		class="{graphClass} relative h-screen overflow-hidden border-r-2 border-gray transition-[width] duration-200"
	>
		{#if collapsed === 'graph'}
			<button
				onclick={() => toggle('graph')}
				class="click flex size-full items-center justify-center hover:bg-gray"
				aria-label="expand-graph"
			>
				<Icon name="side-l-open" />
			</button>
		{:else}
			<div class="absolute top-1 right-1 z-30">
				<button
					onclick={() => toggle('graph')}
					class="click rounded-sm p-1 hover:bg-gray"
					aria-label="collapse-graph"
				>
					<Icon name="side-l-close" />
				</button>
			</div>
			<GlobalCanvas />
		{/if}
	</section>

	<section class="{editorClass} relative h-screen overflow-hidden transition-[width] duration-200">
		{#if collapsed === 'editor'}
			<button
				onclick={() => toggle('editor')}
				class="click flex size-full items-center justify-center hover:bg-gray"
				aria-label="expand-editor"
			>
				<Icon name="side-r-open" />
			</button>
		{:else}
			<div class="absolute top-1 left-1 z-30">
				<button
					onclick={() => toggle('editor')}
					class="click rounded-sm p-1 hover:bg-gray"
					aria-label="collapse-editor"
				>
					<Icon name="side-r-close" />
				</button>
			</div>
			<GlobalEditor />
		{/if}
	</section>
</div>
