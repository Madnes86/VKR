/**
 * Конвертация между EditorJS-данными и тем, что хранит проект.
 *
 * projectStore.text исторически — plain-string в БД (поле `code`). Чтобы
 * не делать миграцию схемы, мы пишем туда JSON.stringify(OutputData) —
 * это backwards-compat: старые проекты содержат plain text, новые — JSON.
 *
 * parseProjectText распознаёт оба варианта. blocksToPlainText
 * сворачивает блоки обратно в plain-text для extract-syntax (NLP не
 * понимает структуру блоков, ему нужен сплошной текст).
 */

import type { OutputData, OutputBlockData } from '@editorjs/editorjs';

export const EMPTY_DATA: OutputData = { time: 0, blocks: [], version: '0' };

/**
 * Превращает строку из projectStore.text в OutputData для EditorJS.
 * Пустая строка → пустые блоки. JSON-строка с полем blocks → сама.
 * Любой другой plain-text → один paragraph-блок.
 */
export function parseProjectText(text: string): OutputData {
	const trimmed = text.trim();
	if (!trimmed) return { time: 0, blocks: [], version: '0' };

	if (trimmed.startsWith('{')) {
		try {
			const parsed = JSON.parse(trimmed);
			if (parsed && Array.isArray(parsed.blocks)) {
				return parsed as OutputData;
			}
		} catch {
			// не JSON — fall through к plain-text-обёртке
		}
	}

	return {
		time: 0,
		version: '0',
		blocks: [
			{
				type: 'paragraph',
				data: { text }
			} as OutputBlockData
		]
	};
}

/**
 * Из OutputData собирает плоский текст для NLP. Заголовки и параграфы —
 * по строке; элементы списков — каждый с новой строки. Inline-теги
 * (<b>, <i>, <code>) удаляются, чтобы spaCy не путалась.
 */
export function blocksToPlainText(data: OutputData): string {
	if (!data || !Array.isArray(data.blocks)) return '';

	const lines: string[] = [];
	for (const block of data.blocks) {
		const text = blockToText(block);
		if (text) lines.push(text);
	}
	return lines.join('\n').trim();
}

function blockToText(block: OutputBlockData): string {
	const type = block.type;
	const data = block.data ?? {};

	if (type === 'paragraph' || type === 'header') {
		return stripHtml(String(data.text ?? ''));
	}
	if (type === 'list') {
		const items = Array.isArray(data.items) ? data.items : [];
		return items
			.map((it: unknown) => {
				if (typeof it === 'string') return stripHtml(it);
				if (it && typeof it === 'object' && 'content' in it) {
					return stripHtml(String((it as { content: unknown }).content ?? ''));
				}
				return '';
			})
			.filter(Boolean)
			.join('\n');
	}
	return '';
}

function stripHtml(html: string): string {
	return html
		.replace(/<[^>]+>/g, '')
		.replace(/&nbsp;/g, ' ')
		.replace(/&amp;/g, '&')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/\s+/g, ' ')
		.trim();
}

export function serializeProjectData(data: OutputData): string {
	return JSON.stringify(data);
}
