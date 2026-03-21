<script lang="ts">
    import { selectedStore, treeStore } from "$lib/stores/objects.svelte";
    import type { IFlatObject } from "$lib/interface";
    import { Form } from "$lib/components";

    let entityes: IFlatObject[] = $derived(treeStore.all.objects ?? []);
    
    function onclick(id: number) {
        selectedStore.set(id);
    }
</script>

<div class="flex flex-col gap-2 items-start w-full">
    {#each entityes as e}
        <button onclick={() => onclick(e.id)} class="w-full">
            <Form icon="entityes" text={e.name} />
        </button>
    {/each}
</div>