<script lang="ts">
    /**
     * Editor — структурный редактор проекта на EditorJS.
     *
     * Поведение:
     * - Источник истины — projectStore.text (JSON.stringify(OutputData)
     *   или legacy plain-text для старых проектов).
     * - Любая правка пользователя дебаунсно сохраняется через
     *   projectStore.setText + .save() (1.2с после последнего изменения).
     *   Перезагрузка страницы не теряет введённый текст.
     * - Кнопка «Извлечь» отправляет плоский текст блоков в LLM-сервис.
     * - Тоггл «LLM-семантика» — opt-in на дополнительный проход через
     *   локальный Ollama (см. parent_semantic).
     */
    import { onMount, onDestroy } from "svelte";
    import EditorJS, { type API, type OutputData } from "@editorjs/editorjs";
    import Header from "@editorjs/header";
    import List from "@editorjs/list";
    import Marker from "@editorjs/marker";
    import InlineCode from "@editorjs/inline-code";

    import { projectStore } from "$lib/stores/project.svelte";
    import { extractSyntax, type ExtractMode } from "$lib/functions/llm";
    import { objects, links } from "$lib/stores/objects.svelte";
    import {
        parseProjectText,
        blocksToPlainText,
        serializeProjectData,
    } from "$lib/functions/editorJsConvert";
    import { Icon, Toggle } from "$lib/components";

    let editorEl: HTMLDivElement | undefined = $state();
    let editor: EditorJS | undefined;
    let editorReady = false;
    let suppressOnChange = false;          // блокирует автосейв при render(...)
    let saveTimer: ReturnType<typeof setTimeout> | null = null;
    let lastSavedText: string = '';        // что мы сами в стор положили — не реагируем на это
    let lastProjectId: number | null = null;

    let generating: boolean = $state(false);
    let status: string = $state('');

    // Тоггл «семантический анализ»: пользователь сам решает, ждать ли
    // дополнительный голос LLM. Persisted через localStorage.
    const SEMANTIC_KEY = 'editor.useSemantic';
    let useSemantic: boolean = $state(
        typeof localStorage !== 'undefined' && localStorage.getItem(SEMANTIC_KEY) === '1'
    );
    $effect(() => {
        if (typeof localStorage === 'undefined') return;
        localStorage.setItem(SEMANTIC_KEY, useSemantic ? '1' : '0');
    });

    const AUTOSAVE_DEBOUNCE_MS = 1200;

    async function performSave(data: OutputData) {
        const serialized = serializeProjectData(data);
        if (serialized === lastSavedText) return;
        lastSavedText = serialized;
        projectStore.setText(serialized);
        await projectStore.save();
        status = projectStore.saveStatus;
    }

    function scheduleSave() {
        if (!editor || !editorReady || suppressOnChange) return;
        if (saveTimer) clearTimeout(saveTimer);
        status = 'editing…';
        saveTimer = setTimeout(async () => {
            saveTimer = null;
            if (!editor) return;
            try {
                const data = await editor.save();
                await performSave(data);
            } catch (e) {
                status = `save failed: ${(e as Error).message}`;
            }
        }, AUTOSAVE_DEBOUNCE_MS);
    }

    /** Реакция на смену проекта: перерисовываем содержимое EditorJS,
     * не дёргая autosave. Внутри проекта (тот же id) ничего не делаем —
     * пользователь сам владеет содержимым. */
    $effect(() => {
        const id = projectStore.id;
        const text = projectStore.text;
        if (!editor || !editorReady) return;
        if (id === lastProjectId) return;
        lastProjectId = id;
        suppressOnChange = true;
        const data = parseProjectText(text);
        lastSavedText = serializeProjectData(data);
        editor.render(data).finally(() => {
            // микрозадержка нужна, потому что EditorJS успевает дёрнуть
            // onChange после render до следующего тика
            setTimeout(() => { suppressOnChange = false; }, 0);
        });
    });

    onMount(() => {
        if (!editorEl) return;
        const initialData = parseProjectText(projectStore.text);
        lastSavedText = serializeProjectData(initialData);
        lastProjectId = projectStore.id;

        editor = new EditorJS({
            holder: editorEl,
            data: initialData,
            placeholder: 'Опишите систему: компоненты, их свойства, связи. EditorJS поддерживает заголовки, списки, выделение и inline-код. Автосохранение каждые ~1.2 секунды.',
            tools: {
                header: {
                    class: Header as any,
                    config: { levels: [2, 3], defaultLevel: 2 },
                    inlineToolbar: true,
                },
                list: {
                    class: List as any,
                    inlineToolbar: true,
                },
                marker: { class: Marker as any },
                inlineCode: { class: InlineCode as any },
            },
            onChange: (_api: API) => {
                scheduleSave();
            },
            onReady: () => {
                editorReady = true;
            },
        });
    });

    onDestroy(() => {
        if (saveTimer) clearTimeout(saveTimer);
        // Если пользователь покидает страницу с несохранёнными правками —
        // дёргаем синхронно последний save (best-effort).
        if (editor) {
            editor.save().then((data) => performSave(data)).catch(() => { /* ignore */ });
            editor.destroy?.();
        }
    });

    async function onExtract() {
        if (!editor || !editorReady || generating) return;
        const data = await editor.save();
        const plain = blocksToPlainText(data);
        if (!plain.trim()) {
            status = 'пустой текст';
            return;
        }
        // Перед извлечением — финализируем сохранение.
        if (saveTimer) {
            clearTimeout(saveTimer);
            saveTimer = null;
        }
        await performSave(data);

        generating = true;
        const mode: ExtractMode = useSemantic ? 'semantic' : 'fast';
        status = mode === 'semantic'
            ? 'разбираю текст + LLM-семантика (это дольше)…'
            : 'разбираю текст…';
        try {
            const res = await extractSyntax(plain, mode);
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

            status = `извлечено: ${res.objects.length} объектов, ${res.links.length} связей`;
        } finally {
            generating = false;
        }
    }
</script>

<div class="flex flex-col h-full p-2 gap-2">
    <div class="flex items-center gap-2 flex-wrap">
        <button
            type="button"
            onclick={() => void onExtract()}
            disabled={generating}
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

        <span title="Дополнительный проход через локальный LLM. Точнее восстанавливает иерархию на длинных текстах, но добавляет 5–30 секунд.">
            <Toggle bind:power={useSemantic} text="LLM-семантика" />
        </span>

        <span class="ml-auto text-xs text-zinc-400">{status}</span>
    </div>

    <div
        bind:this={editorEl}
        class="flex-1 w-full p-3 font-sans text-sm leading-relaxed bg-zinc-950 text-zinc-200 border border-zinc-800 rounded-md overflow-auto"
    ></div>
</div>

<style>
    /* EditorJS впрыскивает свои элементы внутри holder — поправим под
       тёмную тему приложения. Глобальные селекторы потому, что EditorJS
       создаёт DOM в рантайме, и Svelte его не сканирует. */
    :global(.codex-editor) {
        color: rgb(228 228 231);
    }
    :global(.codex-editor__redactor) {
        padding-bottom: 100px !important;
    }
    :global(.ce-toolbar__plus),
    :global(.ce-toolbar__settings-btn) {
        color: rgb(228 228 231);
        background: rgba(255, 255, 255, 0.06);
    }
    :global(.ce-block--selected .ce-block__content) {
        background: rgba(131, 92, 253, 0.1);
    }
    :global(.ce-popover) {
        background: rgb(24 24 27);
        color: rgb(228 228 231);
        border: 1px solid rgb(63 63 70);
    }
    :global(.ce-popover-item:hover) {
        background: rgba(131, 92, 253, 0.2);
    }
    :global(.ce-inline-toolbar) {
        background: rgb(24 24 27);
        color: rgb(228 228 231);
        border: 1px solid rgb(63 63 70);
    }
    :global(.ce-inline-tool:hover),
    :global(.ce-inline-toolbar__dropdown:hover) {
        background: rgba(131, 92, 253, 0.2);
    }
    :global(.cdx-marker) {
        background: rgba(255, 247, 0, 0.35);
        color: inherit;
    }
    :global(.inline-code),
    :global(.cdx-inline-code) {
        background: rgba(131, 92, 253, 0.18);
        color: rgb(228 228 231);
        padding: 1px 4px;
        border-radius: 3px;
        font-family: ui-monospace, SFMono-Regular, monospace;
    }
</style>
