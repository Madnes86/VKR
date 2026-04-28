<script lang="ts">
    /**
     * Editor — текстовое окно проекта. Источник истины — projectStore.text.
     * Кнопка «Извлечь» отправляет draft в бэк и получает готовый граф
     * {objects, links}. Граф полностью замещает текущий: удаляем всё старое
     * и создаём новое через syncQueue, сервер сам обработает.
     */
    import { projectStore } from "$lib/stores/project.svelte";
    import { extractSyntax, type ExtractMode } from "$lib/functions/llm";
    import { objects, links } from "$lib/stores/objects.svelte";
    import { Icon } from "$lib/components";

    let draft: string = $state('');
    let dirty: boolean = $state(false);
    let generating: boolean = $state(false);
    let status: string = $state('');

    // Тоггл «семантический анализ»: пользователь сам решает, ждать ли
    // дополнительный голос LLM. Состояние persisted, чтобы между сессиями
    // не сбрасывалось.
    const SEMANTIC_KEY = 'editor.useSemantic';
    let useSemantic: boolean = $state(
        typeof localStorage !== 'undefined' && localStorage.getItem(SEMANTIC_KEY) === '1'
    );
    $effect(() => {
        if (typeof localStorage === 'undefined') return;
        localStorage.setItem(SEMANTIC_KEY, useSemantic ? '1' : '0');
    });

    // Пока пользователь не правил — draft следует за сохранённым текстом.
    $effect(() => {
        const canonical = projectStore.text;
        if (!dirty && !generating) draft = canonical;
    });

    function oninput(e: Event) {
        const target = e.target as HTMLTextAreaElement;
        draft = target.value;
        dirty = true;
        status = 'modified — нажмите «Извлечь»';
    }

    async function onExtract() {
        if (!draft.trim() || generating) return;
        generating = true;
        const mode: ExtractMode = useSemantic ? 'semantic' : 'fast';
        status = mode === 'semantic'
            ? 'разбираю текст + LLM-семантика (это дольше)…'
            : 'разбираю текст…';
        try {
            const res = await extractSyntax(draft, mode);
            if (!res) { status = 'failed'; return; }
            if (res.objects.length === 0) {
                status = 'spacy ничего не извлёк';
                return;
            }

            // Замещаем граф одним setAll. Не идём через syncQueue/diff, чтобы
            // ребилд treeStore не пересчитал x/y и не сломал drag — позиции
            // узлов задаются физикой и сохраняются между кадрами.
            objects.setAll(res.objects);
            links.setAll(res.links);

            projectStore.setText(draft);
            await projectStore.save();
            dirty = false;
            status = `извлечено: ${res.objects.length} объектов, ${res.links.length} связей`;
        } finally {
            generating = false;
        }
    }

    function onReset() {
        dirty = false;
        status = '';
    }
</script>

<div class="flex flex-col h-full p-2 gap-2">
    <div class="flex items-center gap-2">
        <button
            type="button"
            onclick={() => void onExtract()}
            disabled={generating || !draft.trim()}
            title="Превратить текст в граф объектов: существительные → объекты, прилагательные → дочерние объекты, глаголы → связи."
            class="px-2 py-1 flex gap-2 items-center text-sm rounded-md bg-accent text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accent/90 transition"
        >
            {generating ? 'Извлекаю…' : 'Извлечь'}
            {#if generating}
                <Icon name="load" className="animate-spin" />
            {:else}
                <Icon name="diagramm" />
            {/if}
        </button>
        {#if dirty && !generating}
            <button type="button" onclick={onReset}
                class="px-2 py-1 text-sm rounded-md border border-gray hover:bg-gray-glass transition">
                Отмена
            </button>
        {/if}
        <label
            class="ml-2 flex items-center gap-1.5 text-xs select-none cursor-pointer opacity-80 hover:opacity-100 transition"
            title="Дополнительный проход через локальный LLM. Точнее восстанавливает иерархию на длинных текстах, но добавляет 5–30 секунд."
        >
            <input
                type="checkbox"
                bind:checked={useSemantic}
                disabled={generating}
                class="cursor-pointer"
            />
            <span>LLM-семантика</span>
        </label>
        <span class="ml-auto text-xs text-zinc-400">{status}</span>
    </div>

    <textarea
        class="flex-1 w-full p-3 font-sans text-sm leading-relaxed bg-zinc-950 text-zinc-200 border border-zinc-800 rounded-md resize-none outline-none"
        placeholder="Опишите объекты, их свойства и действия. Нажмите «Извлечь» — текст превратится в граф."
        value={draft}
        {oninput}
        disabled={generating}
    ></textarea>
</div>
