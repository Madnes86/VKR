<script lang="ts" module>
	export type DocsNavNode = {
		title: string;
		icon?: string;
		href?: string;
		children?: DocsNavNode[];
	};
</script>

<script lang="ts">
	import { Icon, DocsNav } from '$lib/components';

	let {
		nodes
	}: {
		nodes: DocsNavNode[];
	} = $props();

	let openMap: Record<number, boolean> = $state({});
</script>

<div class="flex w-full flex-col gap-1">
	{#each nodes as node, i}
		{@const hasChildren = !!node.children?.length}
		{@const open = openMap[i] ?? true}
		<div class="flex w-full flex-col gap-1">
			<div class="flex items-center gap-2">
				{#if hasChildren}
					<button
						onclick={() => (openMap[i] = !open)}
						class={`${open && 'rotate-90'} click rounded-md p-1 hover:bg-gray`}
						aria-label={node.title}
					>
						<Icon name="arrow" />
					</button>
				{/if}
				{#if node.href}
					<a
						href={node.href}
						class="click flex w-full items-center gap-2 rounded-sm p-1 hover:outline-1 hover:outline-accent"
					>
						{#if node.icon}
							<Icon name={node.icon} />
						{/if}
						<span>{node.title}</span>
					</a>
				{:else}
					<div class="flex w-full items-center gap-2 p-1">
						{#if node.icon}
							<Icon name={node.icon} />
						{/if}
						<b>{node.title}</b>
					</div>
				{/if}
			</div>
			{#if hasChildren && open}
				<div class="ml-10!">
					<DocsNav nodes={node.children ?? []} />
				</div>
			{/if}
		</div>
	{/each}
</div>
