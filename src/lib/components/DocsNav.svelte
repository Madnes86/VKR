<script lang="ts" module>
    export type DocsNavNode = {
        title: string;
        icon?: string;
        href?: string;
        children?: DocsNavNode[];
    };
</script>

<script lang="ts">
    import { Icon, DocsNav } from "$lib/components";

    let {
        nodes,
    }: {
        nodes: DocsNavNode[];
    } = $props();

    let openMap: Record<number, boolean> = $state({});
</script>

<div class="flex flex-col gap-1 w-full">
    {#each nodes as node, i}
        {@const hasChildren = !!node.children?.length}
        {@const open = openMap[i] ?? true}
        <div class="flex flex-col gap-1 w-full">
            <div class="flex gap-2 items-center">
                {#if hasChildren}
                    <button
                        onclick={() => (openMap[i] = !open)}
                        class={`${open && 'rotate-90'} click p-1 rounded-md hover:bg-gray`}
                        aria-label={node.title}
                    >
                        <Icon name="arrow" />
                    </button>
                {/if}
                {#if node.href}
                    <a
                        href={node.href}
                        class="click flex gap-2 p-1 items-center w-full rounded-sm hover:outline-accent hover:outline-1"
                    >
                        {#if node.icon}
                            <Icon name={node.icon} />
                        {/if}
                        <span>{node.title}</span>
                    </a>
                {:else}
                    <div class="flex gap-2 p-1 items-center w-full">
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
