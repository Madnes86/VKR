<script lang="ts">
    import { flatObjects, selectedStore, objectsStore, type IFlatObject } from "$lib/stores/objects.svelte";
    import { Form } from "$lib/components";

    let entityes: IFlatObject[] = $state([]);
    objectsStore.subscribe(() => {
        entityes = flatObjects;
    });
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