/**
 * Ambient-декларации для EditorJS-плагинов, в которых пакет не везёт
 * собственный .d.ts. Просто говорим TypeScript-у «модуль есть, тип
 * any». Конструктор всё равно конфигурируется через объект {class, ...}
 * в onMount, и реальная проверка происходит в рантайме.
 */

declare module '@editorjs/header';
declare module '@editorjs/list';
declare module '@editorjs/marker';
declare module '@editorjs/inline-code';
