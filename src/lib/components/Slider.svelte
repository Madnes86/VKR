<script lang="ts">
	let {
		value = $bindable(0),
		min = 0,
		max = 1,
		step = 0.01,
		label = '',
		precision,
		onchange
	}: {
		value: number;
		min: number;
		max: number;
		step: number;
		label?: string;
		precision?: number;
		onchange?: (v: number) => void;
	} = $props();

	// Если precision не задан — выводим из step (число значащих после точки).
	const inferredPrecision = $derived.by(() => {
		if (typeof precision === 'number') return precision;
		const s = String(step);
		const dot = s.indexOf('.');
		return dot < 0 ? 0 : s.length - dot - 1;
	});

	function format(v: number): string {
		return v.toFixed(inferredPrecision);
	}
</script>

<div class="flex w-full flex-col gap-1 px-2 py-1.5 select-none">
	<div class="flex items-center justify-between text-sm">
		<span class="opacity-80">{label}</span>
		<span class="text-accent tabular-nums">{format(value)}</span>
	</div>
	<input
		type="range"
		bind:value
		oninput={() => onchange?.(value)}
		{min}
		{max}
		{step}
		aria-label={label}
		class="diagram-slider"
	/>
</div>

<style>
	.diagram-slider {
		appearance: none;
		-webkit-appearance: none;
		width: 100%;
		height: 4px;
		background: rgb(63 63 70);
		border-radius: 2px;
		outline: none;
		cursor: pointer;
	}
	.diagram-slider::-webkit-slider-thumb {
		appearance: none;
		-webkit-appearance: none;
		width: 14px;
		height: 14px;
		background: var(--color-accent);
		border-radius: 50%;
		cursor: pointer;
		border: 2px solid white;
		box-shadow: 0 1px 4px rgba(0, 0, 0, 0.5);
		transition: transform 0.1s ease;
	}
	.diagram-slider::-webkit-slider-thumb:hover {
		transform: scale(1.15);
	}
	.diagram-slider::-moz-range-thumb {
		width: 14px;
		height: 14px;
		background: var(--color-accent);
		border-radius: 50%;
		cursor: pointer;
		border: 2px solid white;
		box-shadow: 0 1px 4px rgba(0, 0, 0, 0.5);
		transition: transform 0.1s ease;
	}
	.diagram-slider::-moz-range-thumb:hover {
		transform: scale(1.15);
	}
	.diagram-slider:focus-visible {
		outline: 2px solid var(--color-accent);
		outline-offset: 2px;
	}
</style>
