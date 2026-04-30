<script lang="ts">
	import { TreeItem, Icon, TreeForm } from '$lib/components';
	import type { IObject, ILink } from '$lib/interface';

	let {
		id,
		name,
		objects,
		links,
		highlightedIds
	}: {
		id: number;
		name?: string;
		objects: IObject[];
		links?: ILink[];
		highlightedIds: { ids: Set<number>; query: string };
	} = $props();

	let isObjects: boolean = $derived(objects?.length > 0);
	let show: boolean = $derived(true);
	const query = $derived(highlightedIds.query);

	function onclick() {
		show = !show;
	}
</script>

<div class="flex w-full flex-col gap-1">
	{#if name}
		<div class="flex items-center gap-2">
			{#if isObjects}
				<button {onclick} class={`${show && 'rotate-90'} click rounded-md p-1 hover:bg-gray`}>
					<Icon name="arrow" />
				</button>
			{/if}
			<TreeForm {id} {name} type="o" more={isObjects} {query} />
		</div>
	{/if}
	{#if show || !name}
		<div class={`${name && isObjects && 'ml-10!'}`}>
			{#each objects as { id, name, objects, links } (id)}
				<TreeItem {id} {name} {objects} {links} {highlightedIds} />
			{/each}
			<div class="flex flex-col items-center gap-2">
				{#each links as { id, name } (id)}
					<TreeForm {id} {name} type="l" more={false} {query} />
				{/each}
			</div>
		</div>
	{/if}
</div>
