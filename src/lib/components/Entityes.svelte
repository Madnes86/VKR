<script lang="ts">
    /**
     * Entityes — пул компонентов проекта. Сюда попадают узлы с
     * type === 'component': либо помеченные NLP-сервисом (лемма встретилась
     * в тексте ≥2 раз и не входит в стоп-лист общих существительных), либо
     * вручную пользователем. Графовая вкладка по-прежнему показывает все
     * объекты — компоненты там тоже видны как отдельные узлы. Когда
     * появится ref-тип, ссылки в графе будут указывать на каноничную
     * сущность отсюда.
     */
    import { TreeForm } from "$lib/components";
    import { objects } from "$lib/stores/objects.svelte";
    import { searchStore } from "$lib/stores/search.svelte";

    const components = $derived(objects.all.filter(o => o.type === 'component'));

    // Простая подсветка по поиску — для компонентов не используем
    // optional/Local-категории, у этого пула другая семантика.
    const query = $derived(searchStore.get().toLowerCase().trim());
</script>

<div class="p-1 flex flex-col w-full gap-1">
    {#if components.length === 0}
        <p class="p-2 text-sm opacity-60">
            Пул пуст. Компонентом становится сущность, упомянутая в тексте больше одного раза, либо помеченная вручную.
        </p>
    {:else}
        {#each components as c (c.id)}
            <TreeForm id={c.id} name={c.name} type='o' more={false} {query} />
        {/each}
    {/if}
</div>
