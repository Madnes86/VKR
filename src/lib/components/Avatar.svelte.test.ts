import { describe, expect, it } from 'vitest';
import Avatar from './Avatar.svelte';
import { render } from 'vitest-browser-svelte';

describe('Тестирование компонента Avatar', () => {
    it('Без src — фиолетовый круг с первой буквой имени (uppercase)', () => {
        const { container } = render(Avatar, { props: { name: 'vadim', size: 40 } });
        const fallback = container.querySelector('div.bg-accent');
        expect(fallback).not.toBeNull();
        expect(fallback?.textContent?.trim()).toBe('V');
    });

    it('С src — рендерится <img>', () => {
        const { container } = render(Avatar, {
            props: { name: 'Vadim', src: 'https://example.com/a.png', size: 40 },
        });
        const img = container.querySelector('img');
        expect(img).not.toBeNull();
        expect(img?.getAttribute('src')).toBe('https://example.com/a.png');
        expect(img?.getAttribute('alt')).toBe('Vadim');
    });

    it('Пустое имя — fallback "?"', () => {
        const { container } = render(Avatar, { props: { name: '', size: 40 } });
        expect(container.querySelector('div.bg-accent')?.textContent?.trim()).toBe('?');
    });

    it('Размер задаётся через size', () => {
        const { container } = render(Avatar, { props: { name: 'A', size: 64 } });
        const el = container.querySelector('div.bg-accent') as HTMLElement | null;
        expect(el?.style.width).toBe('64px');
        expect(el?.style.height).toBe('64px');
    });
});
