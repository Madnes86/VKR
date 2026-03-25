import { describe, expect, it, vi, beforeEach } from 'vitest';
import TreeForm from "./TreeForm.svelte";
import { render } from "vitest-browser-svelte";
import { page } from 'vitest/browser';


describe('Тестирование компонента формы для дерева', () => {
    function setup() {
        render(TreeForm, {
            props: {
                id: 1, name: 'root', type: 'o', query: '', more: true
            }
        });
        return {
            main: () => page.getByRole('button').first(),
            buttonRead: () => page.getByRole('button').last(),
            input: () => page.getByRole('textbox'),
            getNameText: (text: string) => page.getByText(text),
            wrapper: () => page.getByTestId('row')
        };
    }
    it('Открытие меню для диаграммы')
    it('Открытие меню для боковой панели')
    it('Добавление обьекта в стор')
    it('Изминение типа элемента')
    it('Переместить обьект выше')
    it('Переметить обьект ниже')
    it('Удаление выбранного обьекта из стора')
    it('Изменить имя обьекта')
    it('')
});