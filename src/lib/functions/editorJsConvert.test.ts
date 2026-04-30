import { describe, expect, it } from 'vitest';
import { parseProjectText, blocksToPlainText, serializeProjectData } from './editorJsConvert';
import type { OutputData } from '@editorjs/editorjs';

describe('parseProjectText', () => {
	it('пустую строку отдаёт как пустые блоки', () => {
		const data = parseProjectText('');
		expect(data.blocks).toEqual([]);
	});

	it('строку из пробелов считает пустой', () => {
		const data = parseProjectText('   \n\t  ');
		expect(data.blocks).toEqual([]);
	});

	it('plain-text оборачивает в один paragraph (legacy-проект)', () => {
		const data = parseProjectText('Сервис обращается к базе.');
		expect(data.blocks).toHaveLength(1);
		expect(data.blocks[0].type).toBe('paragraph');
		expect((data.blocks[0].data as { text: string }).text).toBe('Сервис обращается к базе.');
	});

	it('валидный EditorJS JSON отдаёт как есть', () => {
		const original: OutputData = {
			time: 123,
			version: '2.31',
			blocks: [
				{ type: 'header', data: { text: 'Заголовок', level: 2 } },
				{ type: 'paragraph', data: { text: 'Текст параграфа.' } }
			]
		};
		const round = parseProjectText(JSON.stringify(original));
		expect(round.blocks).toHaveLength(2);
		expect(round.blocks[0].type).toBe('header');
	});

	it('невалидный JSON, начинающийся с {, считает plain-text-ом', () => {
		const broken = '{ это не JSON, просто текст с фигурной скобкой';
		const data = parseProjectText(broken);
		expect(data.blocks).toHaveLength(1);
		expect(data.blocks[0].type).toBe('paragraph');
	});

	it('JSON без поля blocks считает plain-text-ом', () => {
		const data = parseProjectText('{"foo": "bar"}');
		expect(data.blocks).toHaveLength(1);
		expect(data.blocks[0].type).toBe('paragraph');
	});
});

describe('blocksToPlainText', () => {
	it('пустые данные → пустая строка', () => {
		expect(blocksToPlainText({ time: 0, version: '0', blocks: [] })).toBe('');
	});

	it('paragraph: возвращает текст без HTML', () => {
		const data: OutputData = {
			time: 0,
			version: '0',
			blocks: [{ type: 'paragraph', data: { text: '<b>Сервис</b> работает.' } } as any]
		};
		expect(blocksToPlainText(data)).toBe('Сервис работает.');
	});

	it('header: тоже возвращает текст без HTML', () => {
		const data: OutputData = {
			time: 0,
			version: '0',
			blocks: [{ type: 'header', data: { text: 'Архитектура', level: 2 } } as any]
		};
		expect(blocksToPlainText(data)).toBe('Архитектура');
	});

	it('list: каждый элемент — отдельная строка', () => {
		const data: OutputData = {
			time: 0,
			version: '0',
			blocks: [
				{
					type: 'list',
					data: { style: 'unordered', items: ['Сервис авторизации', 'База данных', 'Пользователь'] }
				} as any
			]
		};
		expect(blocksToPlainText(data)).toBe('Сервис авторизации\nБаза данных\nПользователь');
	});

	it('list с объектами {content}: тоже разбирается (формат editorjs/list v2)', () => {
		const data: OutputData = {
			time: 0,
			version: '0',
			blocks: [
				{
					type: 'list',
					data: { style: 'unordered', items: [{ content: 'Первый' }, { content: 'Второй' }] }
				} as any
			]
		};
		expect(blocksToPlainText(data)).toBe('Первый\nВторой');
	});

	it('несколько блоков склеивает через \\n', () => {
		const data: OutputData = {
			time: 0,
			version: '0',
			blocks: [
				{ type: 'header', data: { text: 'Сервис' } } as any,
				{ type: 'paragraph', data: { text: 'Обращается к базе.' } } as any,
				{ type: 'list', data: { items: ['Один', 'Два'] } } as any
			]
		};
		expect(blocksToPlainText(data)).toBe('Сервис\nОбращается к базе.\nОдин\nДва');
	});

	it('inline-теги (b, i, code) убираются — spaCy получит чистый текст', () => {
		const data: OutputData = {
			time: 0,
			version: '0',
			blocks: [
				{
					type: 'paragraph',
					data: { text: 'Сервис <i>авторизации</i> проверяет <code>token</code>.' }
				} as any
			]
		};
		expect(blocksToPlainText(data)).toBe('Сервис авторизации проверяет token.');
	});

	it('HTML-сущности декодируются (&nbsp;, &amp;, &lt;, &gt;)', () => {
		const data: OutputData = {
			time: 0,
			version: '0',
			blocks: [
				{
					type: 'paragraph',
					data: { text: 'A&nbsp;B&amp;C&lt;D&gt;E' }
				} as any
			]
		};
		expect(blocksToPlainText(data)).toBe('A B&C<D>E');
	});

	it('неизвестные блоки игнорируются (forward-compat)', () => {
		const data: OutputData = {
			time: 0,
			version: '0',
			blocks: [
				{ type: 'paragraph', data: { text: 'foo' } } as any,
				{ type: 'embed', data: { service: 'youtube' } } as any,
				{ type: 'paragraph', data: { text: 'bar' } } as any
			]
		};
		expect(blocksToPlainText(data)).toBe('foo\nbar');
	});
});

describe('serializeProjectData round-trip', () => {
	it('serialize → parse возвращает структурно тот же OutputData', () => {
		const original: OutputData = {
			time: 1714000000000,
			version: '2.31.2',
			blocks: [
				{ type: 'header', data: { text: 'Заголовок', level: 2 } } as any,
				{ type: 'paragraph', data: { text: 'Текст.' } } as any,
				{ type: 'list', data: { style: 'unordered', items: ['x', 'y'] } } as any
			]
		};
		const serialized = serializeProjectData(original);
		const parsed = parseProjectText(serialized);
		expect(parsed.blocks).toEqual(original.blocks);
		expect(parsed.version).toBe(original.version);
	});
});
