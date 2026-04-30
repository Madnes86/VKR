import { page } from 'vitest/browser';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render } from 'vitest-browser-svelte';
import GlobalCanvas from './GlobalCanvas.svelte';
import { selectedStore, viewStore } from '$lib/stores/objects.svelte';
import { scaleStore } from '$lib/stores/scale.svelte';
import { searchStore } from '$lib/stores/search.svelte';
import { goto } from '$app/navigation';

vi.mock('$app/navigation', () => ({ goto: vi.fn() }));

describe('GlobalCanvas', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		selectedStore.clear('selected');
		selectedStore.clear('hover');
		viewStore.clear();
		searchStore.set('', []);
		scaleStore.value = 0.5; // самый дальний зум → только root
	});

	function setup() {
		render(GlobalCanvas);
	}

	it('на минимальном зуме виден только root', async () => {
		setup();
		await expect.element(page.getByRole('button', { name: 'root' })).toBeInTheDocument();
		await expect.element(page.getByRole('button', { name: 'obj1' })).not.toBeInTheDocument();
		await expect.element(page.getByRole('button', { name: 'pasha' })).not.toBeInTheDocument();
	});

	it('зум in раскрывает детей и прячет корень', async () => {
		scaleStore.value = 1.0; // depth=1
		setup();
		await expect.element(page.getByRole('button', { name: 'root' })).not.toBeInTheDocument();
		await expect.element(page.getByRole('button', { name: 'obj1' })).toBeInTheDocument();
		await expect.element(page.getByRole('button', { name: 'obj4' })).toBeInTheDocument();
	});

	it('на максимальном зуме видны листья и самый глубокий узел', async () => {
		scaleStore.value = 3.0; // depth=maxDepth
		setup();
		await expect.element(page.getByRole('button', { name: 'obj4' })).toBeInTheDocument();
		await expect.element(page.getByRole('button', { name: 'pasha' })).toBeInTheDocument();
		await expect.element(page.getByRole('button', { name: 'searchDefault' })).toBeInTheDocument();
		await expect.element(page.getByRole('button', { name: 'root' })).not.toBeInTheDocument();
	});

	it('кластер показывает бейдж с количеством потомков', async () => {
		setup();
		await expect.element(page.getByText('6', { exact: true })).toBeInTheDocument();
	});

	it('клик по видимой ноде ставит viewStore и идёт в /app', async () => {
		setup();
		await page.getByRole('button', { name: 'root' }).click();
		expect(viewStore.view).toBe(0);
		expect(selectedStore.selected).toBe('o + 0');
		expect(goto).toHaveBeenCalledWith('/app');
	});

	it('кнопка zoom-in увеличивает scaleStore', async () => {
		setup();
		const before = scaleStore.value;
		await page.getByRole('button', { name: 'zoom-in' }).click();
		expect(scaleStore.value).toBeGreaterThan(before);
	});

	it('кнопка zoom-out уменьшает scaleStore', async () => {
		scaleStore.value = 1.0;
		setup();
		const before = scaleStore.value;
		await page.getByRole('button', { name: 'zoom-out' }).click();
		expect(scaleStore.value).toBeLessThan(before);
	});

	it('рендерит видимые связи между видимыми нодами', async () => {
		scaleStore.value = 1.0; // depth=1, obj1 и obj4 видны, read-связь между ними
		setup();
		const lines = document.querySelectorAll('line');
		expect(lines.length).toBe(1);
	});

	it('hover на ноде ставит selectedStore.hover', async () => {
		setup();
		await page.getByRole('button', { name: 'root' }).hover();
		expect(selectedStore.hover).toBe('o + 0');
	});

	it('панорамирование: mousedown на пустой области + mousemove сдвигают камеру', async () => {
		setup();
		const container = document.querySelector('.cursor-grab, .cursor-grabbing') as HTMLElement;
		expect(container).toBeTruthy();
		const wrapper = container.querySelector('[style*="transform"]') as HTMLElement;
		expect(wrapper.style.transform).toContain('translate(0px, 0px)');

		container.dispatchEvent(
			new MouseEvent('mousedown', { bubbles: true, clientX: 100, clientY: 100, button: 0 })
		);
		window.dispatchEvent(
			new MouseEvent('mousemove', { bubbles: true, clientX: 180, clientY: 140 })
		);
		await new Promise((r) => setTimeout(r, 30));
		expect(wrapper.style.transform).toContain('translate(80px, 40px)');
		window.dispatchEvent(new MouseEvent('mouseup'));
	});

	it('клик по zoom-in не стартует панорамирование', async () => {
		setup();
		const container = document.querySelector('.cursor-grab, .cursor-grabbing') as HTMLElement;
		const wrapper = container.querySelector('[style*="transform"]') as HTMLElement;
		await page.getByRole('button', { name: 'zoom-in' }).click();
		await new Promise((r) => setTimeout(r, 30));
		// После клика по zoom-in камера не должна сдвинуться
		expect(wrapper.style.transform).toContain('translate(0px, 0px)');
	});

	function translateOf(el: HTMLElement): { x: number; y: number } {
		const m = el.style.transform.match(/translate\(([-\d.]+)px,\s*([-\d.]+)px\)/);
		return m ? { x: parseFloat(m[1]), y: parseFloat(m[2]) } : { x: 0, y: 0 };
	}

	it('зум колесом по центру контейнера не двигает камеру', async () => {
		setup();
		const container = document.querySelector('.cursor-grab, .cursor-grabbing') as HTMLElement;
		const rect = container.getBoundingClientRect();
		const wrapper = container.querySelector('[style*="translate"]') as HTMLElement;
		container.dispatchEvent(
			new WheelEvent('wheel', {
				clientX: rect.left + rect.width / 2,
				clientY: rect.top + rect.height / 2,
				deltaY: -100,
				bubbles: true
			})
		);
		await new Promise((r) => setTimeout(r, 30));
		const t = translateOf(wrapper);
		expect(Math.abs(t.x)).toBeLessThan(1);
		expect(Math.abs(t.y)).toBeLessThan(1);
	});

	it('зум колесом вне центра сдвигает камеру к курсору', async () => {
		setup();
		const container = document.querySelector('.cursor-grab, .cursor-grabbing') as HTMLElement;
		const rect = container.getBoundingClientRect();
		const wrapper = container.querySelector('[style*="translate"]') as HTMLElement;
		container.dispatchEvent(
			new WheelEvent('wheel', {
				clientX: rect.left + 20,
				clientY: rect.top + 20,
				deltaY: -100,
				bubbles: true
			})
		);
		await new Promise((r) => setTimeout(r, 30));
		const t = translateOf(wrapper);
		expect(Math.abs(t.x) + Math.abs(t.y)).toBeGreaterThan(5);
	});

	function parseNodeStyle(el: HTMLElement) {
		const s = el.getAttribute('style') ?? '';
		const left = parseFloat(s.match(/left:\s*([-\d.]+)/)?.[1] ?? '0');
		const top = parseFloat(s.match(/top:\s*([-\d.]+)/)?.[1] ?? '0');
		const width = parseFloat(s.match(/width:\s*([-\d.]+)/)?.[1] ?? '0');
		const height = parseFloat(s.match(/height:\s*([-\d.]+)/)?.[1] ?? '0');
		return { left, top, width, height };
	}

	it('размер родителя-кластера больше базового и вмещает детей', async () => {
		setup();
		const rootBtn = document.querySelector('[aria-label="root"]') as HTMLElement;
		const root = parseNodeStyle(rootBtn);
		// root имеет 2 прямых детей (obj1 — сам кластер c 2 детьми; obj4 — лист)
		// По формуле R = r_eff + r_actual_child, где r_eff = maxChild * 0.65.
		// Максимальный дочерний (obj1) сам > BASE_SIZE, т.к. тоже кластер.
		// Следовательно root.size > 2 * (BASE * 0.65 + BASE/2) = BASE * 2.3 = 147.2.
		expect(root.width).toBeGreaterThan(147);
		expect(root.width).toBe(root.height); // круг
	});

	it('при появлении на зуме дети помещаются внутрь круга родителя', async () => {
		setup();
		const rootBtn = document.querySelector('[aria-label="root"]') as HTMLElement;
		const root = parseNodeStyle(rootBtn);
		const rootCx = root.left + root.width / 2;
		const rootCy = root.top + root.height / 2;
		const rootR = root.width / 2;

		scaleStore.value = 1.0; // depth растёт → obj1, obj4 появляются
		await new Promise((r) => setTimeout(r, 20));

		for (const name of ['obj1', 'obj4']) {
			const btn = document.querySelector(`[aria-label="${name}"]`) as HTMLElement;
			expect(btn, `node ${name} should be in DOM`).toBeTruthy();
			const n = parseNodeStyle(btn);
			const cx = n.left + n.width / 2;
			const cy = n.top + n.height / 2;
			const dist = Math.sqrt((cx - rootCx) ** 2 + (cy - rootCy) ** 2);
			const maxAllowed = rootR - n.width / 2 + 10;
			expect(
				dist,
				`${name} distance ${dist} should fit inside root radius ${maxAllowed}`
			).toBeLessThanOrEqual(maxAllowed);
		}
	});

	it('зум-цикл детерминирован: дети возвращаются на те же позиции', async () => {
		setup();
		scaleStore.value = 1.0;
		await new Promise((r) => setTimeout(r, 20));
		const btn1 = document.querySelector('[aria-label="obj1"]') as HTMLElement;
		const pos1 = parseNodeStyle(btn1);

		// Zoom out and back in — позиция должна сохраниться (± допуск физики)
		scaleStore.value = 0.5;
		await new Promise((r) => setTimeout(r, 30));
		scaleStore.value = 1.0;
		await new Promise((r) => setTimeout(r, 20));

		const btn2 = document.querySelector('[aria-label="obj1"]') as HTMLElement;
		const pos2 = parseNodeStyle(btn2);
		expect(Math.abs(pos2.left - pos1.left)).toBeLessThan(30);
		expect(Math.abs(pos2.top - pos1.top)).toBeLessThan(30);
	});

	it('совпадения с searchStore подсвечиваются в имени ноды', async () => {
		searchStore.set('oot', []);
		setup();
		const rootBtn = document.querySelector('[aria-label="root"]') as HTMLElement;
		const matches = rootBtn.querySelectorAll('.is-match');
		// LightText теперь рендерит матч одним span'ом.
		expect(matches.length).toBe(1);
		expect(matches[0].textContent).toBe('oot');
	});

	it('шрифт ноды пропорционален её размеру', async () => {
		setup();
		scaleStore.value = 3.0; // видны лист-ноды (обычного размера) и searchDefault
		await new Promise((r) => setTimeout(r, 20));
		const leafBtn = document.querySelector('[aria-label="obj4"]') as HTMLElement;
		const leafFont = parseFloat(leafBtn.style.fontSize);

		scaleStore.value = 0.5; // виден root (большой кластер)
		await new Promise((r) => setTimeout(r, 20));
		const rootBtn = document.querySelector('[aria-label="root"]') as HTMLElement;
		const rootFont = parseFloat(rootBtn.style.fontSize);

		expect(leafFont).toBeGreaterThanOrEqual(11); // минимум 11px
		expect(rootFont).toBeGreaterThan(leafFont); // у большой ноды шрифт больше
	});
});
