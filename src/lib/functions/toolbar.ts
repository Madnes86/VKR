// Геометрия позиционирования DiagramToolbar.
//
// Toolbar показывается поверх диаграммы и должен оставаться внутри
// «свободной» зоны между открытыми SideBar'ами слева и справа. Центр
// тулбара ровно посередине этой зоны, а ширина сжимается, если доступного
// места меньше максимальной (но не падает ниже минимальной — иначе
// контролы сольются).

export interface ToolbarLayout {
	centerX: number;
	width: number;
}

export interface ToolbarLayoutOptions {
	windowWidth: number;
	leftSide: number;
	rightSide: number;
	maxWidth?: number;
	minWidth?: number;
	sideMargin?: number;
}

const DEFAULT_MAX_WIDTH = 440;
const DEFAULT_MIN_WIDTH = 220;
const DEFAULT_SIDE_MARGIN = 16;

export function computeToolbarLayout(opts: ToolbarLayoutOptions): ToolbarLayout {
	const { windowWidth, leftSide, rightSide } = opts;
	const maxWidth = opts.maxWidth ?? DEFAULT_MAX_WIDTH;
	const minWidth = opts.minWidth ?? DEFAULT_MIN_WIDTH;
	const sideMargin = opts.sideMargin ?? DEFAULT_SIDE_MARGIN;

	const centerX = (leftSide + windowWidth - rightSide) / 2;
	const available = windowWidth - leftSide - rightSide - sideMargin * 2;
	const width = Math.max(minWidth, Math.min(maxWidth, available));

	return { centerX, width };
}
