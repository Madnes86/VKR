/**
 * Билдер i18n-конфига для EditorJS.
 *
 * Превращает функцию-переводчик из $lib/i18n (i18n.t) в структуру,
 * которую ждёт EditorJS-конструктор: {direction, messages: {ui,
 * toolNames, tools, blockTunes}}. Ключи EditorJS — английские
 * захардкоженные строки, и мы переводим из них в значения локали.
 *
 * Вынесено в отдельный модуль, потому что:
 *   - чистая функция, легко покрывается юнит-тестами без браузера;
 *   - Editor.svelte становится тоньше: только мостик между storeом
 *     и инстансом редактора, а не справочник переводов.
 */

import type { I18nConfig } from '@editorjs/editorjs/types/configs/i18n-config';

export type Translator = (key: string) => string;

export function buildEditorI18n(t: Translator): I18nConfig {
	return {
		direction: 'ltr',
		messages: {
			ui: {
				blockTunes: {
					toggler: { 'Click to tune': t('editor.ui.tune') }
				},
				inlineToolbar: {
					converter: { 'Convert to': t('editor.ui.convertTo') }
				},
				toolbar: {
					toolbox: { Add: t('editor.ui.add') }
				},
				popover: {
					Filter: t('editor.ui.filter'),
					'Nothing found': t('editor.ui.nothingFound'),
					'Convert to': t('editor.ui.convertTo')
				}
			},
			toolNames: {
				Text: t('editor.tool.text'),
				Heading: t('editor.tool.heading'),
				List: t('editor.tool.list'),
				Marker: t('editor.tool.marker'),
				InlineCode: t('editor.tool.inlineCode')
			},
			tools: {
				header: {
					'Heading 1': t('editor.heading.h1'),
					'Heading 2': t('editor.heading.h2'),
					'Heading 3': t('editor.heading.h3')
				},
				list: {
					Unordered: t('editor.list.unordered'),
					Ordered: t('editor.list.ordered')
				}
			},
			blockTunes: {
				delete: {
					Delete: t('editor.tune.delete'),
					'Click to delete': t('editor.tune.deleteConfirm')
				},
				moveUp: { 'Move up': t('editor.tune.moveUp') },
				moveDown: { 'Move down': t('editor.tune.moveDown') }
			}
		}
	};
}
