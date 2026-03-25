import { describe, expect, it, vi, beforeEach } from 'vitest';
import Entityes from "./Entityes.svelte";
import { render } from "vitest-browser-svelte";
import { page } from 'vitest/browser';


describe('Тестирование компонета сущностей', () => {
    function setup() {
        render(Entityes);
        return {
            input: page.getByPlaceholder('Search'),
            searchBtn: page.getByRole('button', { name: 'search' }),
            globalBtn: page.getByRole('button', { name: 'global'}),
            categoryBtn: page.getByRole('button', { name: 'category'}),
            clearBtn: page.getByRole('button', { name: 'cross' })
        };
    }
    it('')
});