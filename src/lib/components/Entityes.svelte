<script lang="ts">
    import { flatData, objectsStore, type IFlatObject } from "$lib/stores/objects";
    import { Form } from "$lib/components";

    let entityes: IFlatObject[] = $state([]);
    objectsStore.subscribe(() => {
        entityes = flatData;
    })
</script>

<div class="flex flex-col gap-2 items-start w-full">
    {#each entityes as e}
        <Form icon="entityes" text={e.name} />
    {/each}
</div>