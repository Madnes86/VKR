<script lang="ts">
    import { data } from "$lib/stores/objects";
    import { Form } from "$lib/components";

    let entityes = data;
</script>

<div class="flex flex-col gap-2 items-start w-full">
    {#each entityes as e}
        <Form icon="entityes" text={e.name} />
    {/each}
</div>