import { describe, expect, it } from 'vitest';
import { computeToolbarLayout } from './toolbar';

describe('computeToolbarLayout', () => {
	it('Без открытых панелей — центр на середине окна, ширина = max', () => {
		const { centerX, width } = computeToolbarLayout({
			windowWidth: 1200,
			leftSide: 0,
			rightSide: 0
		});
		expect(centerX).toBe(600);
		expect(width).toBe(440); // max
	});

	it('Только левая панель — центр сдвинут вправо ровно на половину её ширины', () => {
		const { centerX } = computeToolbarLayout({
			windowWidth: 1200,
			leftSide: 300,
			rightSide: 0
		});
		// центр свободной зоны = 300 + (1200 - 300) / 2 = 750
		expect(centerX).toBe(750);
	});

	it('Только правая панель — центр сдвинут влево', () => {
		const { centerX } = computeToolbarLayout({
			windowWidth: 1200,
			leftSide: 0,
			rightSide: 300
		});
		// центр = (0 + 1200 - 300) / 2 = 450
		expect(centerX).toBe(450);
	});

	it('Обе панели — центр между ними', () => {
		const { centerX } = computeToolbarLayout({
			windowWidth: 1400,
			leftSide: 300,
			rightSide: 200
		});
		// (300 + 1400 - 200) / 2 = 750
		expect(centerX).toBe(750);
	});

	it('Узкая свободная зона — ширина сжимается с учётом боковых отступов', () => {
		// available = 600 - 200 - 200 - 16*2 = 168, ниже минимума → minWidth=220
		const { width } = computeToolbarLayout({
			windowWidth: 600,
			leftSide: 200,
			rightSide: 200
		});
		expect(width).toBe(220);
	});

	it('Промежуточная зона — ширина равна доступной (между min и max)', () => {
		// available = 800 - 100 - 100 - 32 = 568 → ограничено max=440? Нет, 568 > 440 → 440.
		// Возьмём 800 - 250 - 250 - 32 = 268 — между 220 и 440
		const { width } = computeToolbarLayout({
			windowWidth: 800,
			leftSide: 250,
			rightSide: 250
		});
		expect(width).toBe(268);
	});

	it('Большое окно — ширина капится на maxWidth', () => {
		const { width } = computeToolbarLayout({
			windowWidth: 4000,
			leftSide: 0,
			rightSide: 0
		});
		expect(width).toBe(440);
	});

	it('Кастомные maxWidth/minWidth/sideMargin учитываются', () => {
		const { width } = computeToolbarLayout({
			windowWidth: 1000,
			leftSide: 0,
			rightSide: 0,
			maxWidth: 600,
			minWidth: 100,
			sideMargin: 50
		});
		// available = 1000 - 100 = 900, max=600 → 600
		expect(width).toBe(600);
	});

	it('Отрицательная доступная зона не ломает результат — выдаём minWidth', () => {
		const { width } = computeToolbarLayout({
			windowWidth: 200,
			leftSide: 200,
			rightSide: 200
		});
		expect(width).toBe(220); // minWidth, не отрицательное
	});
});
