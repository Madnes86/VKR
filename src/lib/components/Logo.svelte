<script lang="ts">
	let {
		width = 60,
		height = 60,
		stroke = '#835CFD',
		fill = '#FFF',
		iconOnly = false
	}: {
		width?: number;
		height?: number;
		stroke?: string;
		fill?: string;
		// Только круг, без текста: используется в шапке SideBar
		// (≈24–28px) — на таком размере «Orbita» нечитаема.
		iconOnly?: boolean;
	} = $props();
</script>

<svg
	{width}
	{height}
	viewBox="0 0 {width} {height}"
	fill="none"
	class="block"
	xmlns="http://www.w3.org/2000/svg"
>
	<circle cx={width / 2} cy={height / 2} r={height / 3} {stroke} stroke-width={height / 9} />
	{#if iconOnly}
		<!-- Маленькая «планета» по центру — на размере 20px одна
		     обводка нечитаема, заполненная точка делает иконку
		     узнаваемой и более насыщенной. -->
		<circle cx={width / 2} cy={height / 2} r={height / 8} fill={stroke} />
	{:else}
		<!-- Шрифт Fredoka One подгружается через <link> в app.html.
		     Раньше @import url был внутри SVG <defs><style> — Chromium
		     для inline-svg внешние ресурсы не догружает, поэтому текст
		     рендерился системным fallback-ом. -->
		<text
			x={width / 2}
			y={height / 2}
			text-anchor="middle"
			font-family="'Fredoka One', cursive"
			font-size={height * 0.3}
			font-weight="normal"
			{fill}
			dominant-baseline="middle"
		>
			Orbita
		</text>
	{/if}
</svg>
