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
	 * - Локализация UI EditorJS берётся из проектного i18n; смена языка
	 *   пересоздаёт инстанс редактора с сохранением содержимого.
	 */
	import { onMount, onDestroy, untrack } from 'svelte';
	import EditorJS, { type API, type OutputData } from '@editorjs/editorjs';
	import Header from '@editorjs/header';
	import List from '@editorjs/list';
	import Marker from '@editorjs/marker';
	import InlineCode from '@editorjs/inline-code';

	import { projectStore } from '$lib/stores/project.svelte';
	import { extractSyntax, type ExtractMode } from '$lib/functions/llm';
	import { objects, links } from '$lib/stores/objects.svelte';
	import { validationStore } from '$lib/stores/validation.svelte';
	import { notificationStore } from '$lib/stores/notification.svelte';
	import {
		parseProjectText,
		blocksToPlainText,
		serializeProjectData
	} from '$lib/functions/editorJsConvert';
	import { buildEditorI18n } from '$lib/functions/editorJsI18n';
	import { i18n } from '$lib/i18n';
	import { Icon, Toggle } from '$lib/components';

	let editorEl: HTMLDivElement | undefined = $state();
	let editor: EditorJS | undefined;
	// editorReady — РЕАКТИВНЫЙ: $effect-ы ниже проверяют этот флаг, и
	// EditorJS взводит его асинхронно из onReady. Без $state реактивная
	// подписка не работает, и render(data) после load() не вызывается —
	// юзер видит пустой редактор и печатает поверх загруженного текста.
	let editorReady: boolean = $state(false);
	let suppressOnChange = false; // блокирует автосейв при render(...)
	let saveTimer: ReturnType<typeof setTimeout> | null = null;
	let lastSavedText: string = ''; // что мы сами в стор положили — не реагируем на это
	let lastProjectId: number | null = null;
	let lastBuiltLang: string | null = null;

	// Локальный бэкап содержимого редактора. Нужен для двух случаев:
	// 1) Гость не вызывает projectStore.load(), id остаётся null,
	//    projectStore.save() сразу возвращает false → текст пропадал.
	// 2) Сетевой/серверный сбой — пишем локально, синхронизуем при
	//    следующем успешном save через performSave.
	const LOCAL_DRAFT_KEY = 'editor.draft.v1';
	function loadLocalDraft(): string | null {
		if (typeof localStorage === 'undefined') return null;
		try {
			return localStorage.getItem(LOCAL_DRAFT_KEY);
		} catch {
			return null;
		}
	}
	function saveLocalDraft(serialized: string): void {
		if (typeof localStorage === 'undefined') return;
		try {
			localStorage.setItem(LOCAL_DRAFT_KEY, serialized);
		} catch {
			/* quota — игнорируем, не валим автосейв */
		}
	}

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

		// Локальный бэкап ВСЕГДА: если сервер потом упадёт или это
		// гость — на следующем заходе читаем отсюда.
		saveLocalDraft(serialized);
		projectStore.setText(serialized);

		if (projectStore.id !== null) {
			const ok = await projectStore.save();
			status = ok ? projectStore.saveStatus : `только локально (${projectStore.saveStatus})`;
		} else {
			status = 'сохранено локально (нет аккаунта)';
		}
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

	/** Создаёт инстанс EditorJS с текущей i18n. Используется и при
	 * первом маунте, и при смене языка. */
	function createEditor(initialData: OutputData) {
		if (!editorEl) return;
		lastBuiltLang = i18n.lang;
		editorReady = false;
		suppressOnChange = true;
		editor = new EditorJS({
			holder: editorEl,
			data: initialData,
			placeholder: i18n.t('editor.placeholder'),
			i18n: buildEditorI18n((k) => i18n.t(k)) as any,
			tools: {
				header: {
					class: Header as any,
					config: { levels: [2, 3], defaultLevel: 2 },
					inlineToolbar: true
				},
				list: {
					class: List as any,
					inlineToolbar: true
				},
				marker: { class: Marker as any },
				inlineCode: { class: InlineCode as any }
			},
			onChange: (_api: API) => {
				scheduleSave();
			},
			onReady: () => {
				editorReady = true;
				// Снимаем suppress только когда редактор готов — иначе
				// его initial render тригернёт ложный autosave.
				setTimeout(() => {
					suppressOnChange = false;
				}, 0);
			}
		});
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
			setTimeout(() => {
				suppressOnChange = false;
			}, 0);
		});
	});

	/** Реакция на смену языка: пересоздаём инстанс с новым i18n,
	 * но сохраняем текущие блоки. EditorJS не переключает локаль на
	 * лету — требуется destroy + new EditorJS. */
	$effect(() => {
		const lang = i18n.lang;
		if (!editor || !editorReady) return;
		if (lang === lastBuiltLang) return;
		// untrack: внутри асинхронной перестройки не хотим, чтобы
		// дополнительные обращения к store-ам триггерили этот же effect.
		untrack(() => rebuildForLanguage());
	});

	async function rebuildForLanguage() {
		if (!editor) return;
		// Финализируем pending-сейв, чтобы не потерять последние правки.
		if (saveTimer) {
			clearTimeout(saveTimer);
			saveTimer = null;
		}
		let snapshot: OutputData;
		try {
			snapshot = await editor.save();
		} catch {
			snapshot = parseProjectText(projectStore.text);
		}
		editor.destroy?.();
		editor = undefined;
		// Дать DOM-у освободиться перед созданием нового инстанса.
		await new Promise((r) => requestAnimationFrame(() => r(null)));
		createEditor(snapshot);
	}

	/** Выбирает данные для первого рендера: сначала текущий стор; если
	 * он пуст (гость, либо load() ещё не отработал) — пробуем
	 * localStorage-драфт. Это и есть восстановление текста после
	 * перезагрузки страницы для неаутентифицированного юзера. */
	function pickInitialData(): OutputData {
		const fromStore = parseProjectText(projectStore.text);
		if (fromStore.blocks.length > 0) return fromStore;
		const local = loadLocalDraft();
		if (local) {
			const restored = parseProjectText(local);
			if (restored.blocks.length > 0) return restored;
		}
		return fromStore;
	}

	onMount(() => {
		const initialData = pickInitialData();
		lastSavedText = serializeProjectData(initialData);
		lastProjectId = projectStore.id;
		// Если восстановили текст из локального драфта (и projectStore
		// пуст) — синхронизуем стор, чтобы остальное приложение видело
		// его как «текст проекта». save() для гостя вернёт false тихо.
		if (initialData.blocks.length > 0 && !projectStore.text.trim()) {
			projectStore.setText(serializeProjectData(initialData));
		}
		createEditor(initialData);
	});

	onDestroy(() => {
		if (saveTimer) clearTimeout(saveTimer);
		// Если пользователь покидает страницу с несохранёнными правками —
		// дёргаем синхронно последний save (best-effort).
		if (editor) {
			editor
				.save()
				.then((data) => performSave(data))
				.catch(() => {
					/* ignore */
				});
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
		status =
			mode === 'semantic' ? 'разбираю текст + LLM-семантика (это дольше)…' : 'разбираю текст…';
		try {
			const res = await extractSyntax(plain, mode);
			if (!res) {
				status = 'failed';
				return;
			}
			if (res.objects.length === 0) {
				status = 'spacy ничего не извлёк';
				return;
			}

			// Замещаем граф одним setAll. Не идём через syncQueue/diff, чтобы
			// ребилд treeStore не пересчитал x/y и не сломал drag — позиции
			// узлов задаются физикой и сохраняются между кадрами.
			objects.setAll(res.objects);
			links.setAll(res.links);

			// Прогоняем валидацию по свежему графу: если что-то найдено —
			// notification + список в Alerts; объекты/связи окрасятся
			// через validationStore.severityForObject/Link.
			const issues = validationStore.run();
			const errs = validationStore.errors.length;
			const warns = validationStore.warnings.length;
			if (errs > 0) {
				notificationStore.error(`Проверка: ${errs} ошибок, ${warns} предупреждений`);
			} else if (warns > 0) {
				notificationStore.show({
					icon: 'alert',
					title: `Проверка: ${warns} предупреждений`,
					type: 'warning'
				});
			}
			status = `извлечено: ${res.objects.length} объектов, ${res.links.length} связей · issues: ${issues.length}`;
		} finally {
			generating = false;
		}
	}
</script>

<div class="flex h-full flex-col gap-2 p-2">
	<div class="flex flex-wrap items-center gap-2">
		<button
			type="button"
			onclick={() => void onExtract()}
			disabled={generating}
			title="Превратить текст в граф объектов: существительные → объекты, прилагательные → дочерние объекты, глаголы → связи."
			class="flex items-center gap-2 rounded-md bg-accent p-1.5 text-sm text-white transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-50"
		>
			{#if generating}
				<Icon name="load" className="animate-spin" />
			{:else}
				<Icon name="al" />
			{/if}
		</button>

		<span
			title="Дополнительный проход через локальный LLM. Точнее восстанавливает иерархию на длинных текстах, но добавляет 5–30 секунд."
		>
			<Toggle bind:power={useSemantic} text="LLM-семантика" />
		</span>

		<span class="ml-auto text-xs text-zinc-400">{status}</span>
	</div>

	<div
		bind:this={editorEl}
		class="editor-host text-md w-full flex-1 overflow-auto rounded-md font-sans leading-relaxed text-white"
	></div>
</div>

<style>
	/* EditorJS впрыскивает свои элементы внутри holder — поправим под
       тёмную тему приложения. Глобальные селекторы потому, что EditorJS
       создаёт DOM в рантайме, и Svelte его не сканирует.
       Используем переменные EditorJS (--color-*) где они есть; иначе
       переопределяем селекторы напрямую. */
	:global(.editor-host) {
		--color-text-primary: rgb(244 244 245);
		--color-text-secondary: rgb(161 161 170);
		--color-line-gray: rgb(63 63 70);
		--color-active-icon: rgb(244 244 245);
		--color-light-gray: rgb(39 39 42);
		--color-gray: rgb(63 63 70);
		--color-dark: rgb(244 244 245);
		--color-border: rgb(63 63 70);
		--selectionColor: rgba(131, 92, 253, 0.25);
	}

	:global(.codex-editor),
	:global(.codex-editor__redactor) {
		color: rgb(228 228 231);
	}
	:global(.codex-editor__redactor) {
		padding-bottom: 100px !important;
	}

	/* Плейсхолдер пустого блока */
	:global(.ce-paragraph[data-placeholder]:empty::before),
	:global(.ce-block--empty .ce-paragraph::before),
	:global(.codex-editor--empty .ce-block:first-child .ce-paragraph::before) {
		color: rgb(113 113 122);
		opacity: 1;
	}

	/* Plus-кнопка слева и шестерёнка-настройки */
	:global(.ce-toolbar__plus),
	:global(.ce-toolbar__settings-btn) {
		color: rgb(228 228 231);
		background: rgba(255, 255, 255, 0.04);
		border: 1px solid rgb(63 63 70);
	}
	:global(.ce-toolbar__plus:hover),
	:global(.ce-toolbar__settings-btn:hover) {
		background: rgba(131, 92, 253, 0.18);
		color: rgb(244 244 245);
	}

	/* Выделение текущего блока */
	:global(.ce-block--selected .ce-block__content) {
		background: rgba(131, 92, 253, 0.12);
		border-radius: 4px;
	}

	/* Поповер «добавить блок» / «превратить в…» */
	:global(.ce-popover),
	:global(.ce-popover__container) {
		background: rgb(24 24 27);
		color: rgb(228 228 231);
		border: 1px solid rgb(63 63 70);
		box-shadow: 0 12px 32px rgba(0, 0, 0, 0.45);
	}
	:global(.ce-popover-item__icon) {
		background: rgba(255, 255, 255, 0.05);
		color: rgb(228 228 231);
		border: 1px solid rgb(63 63 70);
	}
	:global(.ce-popover-item__title),
	:global(.ce-popover-item__secondary-title) {
		color: rgb(228 228 231);
	}
	:global(.ce-popover-item:hover),
	:global(.ce-popover-item--focused) {
		background: rgba(131, 92, 253, 0.2);
	}
	:global(.ce-popover-item:hover .ce-popover-item__icon),
	:global(.ce-popover-item--focused .ce-popover-item__icon) {
		background: rgba(131, 92, 253, 0.4);
	}
	:global(.ce-popover__search) {
		background: rgb(39 39 42);
		color: rgb(228 228 231);
		border: 1px solid rgb(63 63 70);
		border-radius: 4px;
	}
	:global(.ce-popover__nothing-found-message) {
		color: rgb(161 161 170);
	}

	/* Inline-toolbar (B/I/код/конвертация/marker) */
	:global(.ce-inline-toolbar) {
		background: rgb(24 24 27);
		color: rgb(228 228 231);
		border: 1px solid rgb(63 63 70);
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45);
	}
	:global(.ce-inline-tool),
	:global(.ce-inline-toolbar__dropdown) {
		color: rgb(228 228 231);
	}
	:global(.ce-inline-tool:hover),
	:global(.ce-inline-toolbar__dropdown:hover) {
		background: rgba(131, 92, 253, 0.2);
	}
	:global(.ce-inline-tool--active) {
		color: rgb(167, 139, 250);
		background: rgba(131, 92, 253, 0.18);
	}
	:global(.ce-inline-tool-input) {
		background: rgb(39 39 42);
		color: rgb(228 228 231);
		border: 1px solid rgb(63 63 70);
	}
	:global(.ce-conversion-toolbar) {
		background: rgb(24 24 27);
		color: rgb(228 228 231);
		border: 1px solid rgb(63 63 70);
	}
	:global(.ce-conversion-tool:hover) {
		background: rgba(131, 92, 253, 0.2);
	}

	/* Settings (delete / move) */
	:global(.ce-settings) {
		background: rgb(24 24 27);
		color: rgb(228 228 231);
		border: 1px solid rgb(63 63 70);
	}
	:global(.cdx-settings-button:hover) {
		background: rgba(131, 92, 253, 0.2);
	}

	/* Inline-плагины: marker, inline-code */
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

	/* Список */
	:global(.cdx-list) {
		color: rgb(228 228 231);
	}

	/* Селекшен внутри редактора — accent-фиолетовый */
	:global(.codex-editor) ::selection {
		background: rgba(131, 92, 253, 0.35);
	}
</style>
