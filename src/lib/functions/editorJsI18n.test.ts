import { describe, expect, it } from 'vitest';
import { buildEditorI18n } from './editorJsI18n';


describe('buildEditorI18n', () => {
    it('передаёт значения переводчика в правильные слоты словаря', () => {
        const t = (k: string) => `T<${k}>`;
        const cfg = buildEditorI18n(t);

        expect(cfg.direction).toBe('ltr');
        const ui = cfg.messages?.ui as any;
        expect(ui.blockTunes.toggler['Click to tune']).toBe('T<editor.ui.tune>');
        expect(ui.toolbar.toolbox.Add).toBe('T<editor.ui.add>');
        expect(ui.popover.Filter).toBe('T<editor.ui.filter>');
        expect(ui.inlineToolbar.converter['Convert to']).toBe('T<editor.ui.convertTo>');

        const toolNames = cfg.messages?.toolNames as any;
        expect(toolNames.Heading).toBe('T<editor.tool.heading>');
        expect(toolNames.List).toBe('T<editor.tool.list>');
        expect(toolNames.Marker).toBe('T<editor.tool.marker>');
        expect(toolNames.InlineCode).toBe('T<editor.tool.inlineCode>');
        expect(toolNames.Text).toBe('T<editor.tool.text>');

        const tools = cfg.messages?.tools as any;
        expect(tools.header['Heading 2']).toBe('T<editor.heading.h2>');
        expect(tools.list.Unordered).toBe('T<editor.list.unordered>');
        expect(tools.list.Ordered).toBe('T<editor.list.ordered>');

        const blockTunes = cfg.messages?.blockTunes as any;
        expect(blockTunes.delete.Delete).toBe('T<editor.tune.delete>');
        expect(blockTunes.moveUp['Move up']).toBe('T<editor.tune.moveUp>');
        expect(blockTunes.moveDown['Move down']).toBe('T<editor.tune.moveDown>');
    });

    it('переключение переводчика даёт другой словарь (no caching внутри билдера)', () => {
        const ru = (k: string) => k === 'editor.ui.add' ? 'Добавить' : '?';
        const en = (k: string) => k === 'editor.ui.add' ? 'Add' : '?';
        const ruCfg = buildEditorI18n(ru);
        const enCfg = buildEditorI18n(en);
        expect((ruCfg.messages?.ui as any).toolbar.toolbox.Add).toBe('Добавить');
        expect((enCfg.messages?.ui as any).toolbar.toolbox.Add).toBe('Add');
    });

    it('кириллические значения сохраняются как есть (sanity check)', () => {
        const ru = (k: string) => {
            const map: Record<string, string> = {
                'editor.tool.heading': 'Заголовок',
                'editor.list.unordered': 'Маркированный',
                'editor.tune.delete': 'Удалить',
            };
            return map[k] ?? k;
        };
        const cfg = buildEditorI18n(ru);
        expect((cfg.messages?.toolNames as any).Heading).toBe('Заголовок');
        expect((cfg.messages?.tools as any).list.Unordered).toBe('Маркированный');
        expect((cfg.messages?.blockTunes as any).delete.Delete).toBe('Удалить');
    });

    it('покрывает все слоты EditorJS, которые мы реально используем', () => {
        // Проверка целостности: если кто-то выбьет один из слотов из
        // builder-а, тест сразу красный.
        const t = () => 'x';
        const cfg = buildEditorI18n(t);
        const ui = cfg.messages?.ui as any;
        expect(ui.blockTunes).toBeDefined();
        expect(ui.toolbar).toBeDefined();
        expect(ui.popover).toBeDefined();
        expect(ui.inlineToolbar).toBeDefined();
        expect(cfg.messages?.toolNames).toBeDefined();
        expect(cfg.messages?.tools).toBeDefined();
        expect(cfg.messages?.blockTunes).toBeDefined();
    });
});
