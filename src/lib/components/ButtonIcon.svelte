<script lang="ts">
	import Icon from './Icon.svelte';

	let {
		onclick,
		name,
		stroke,
		title,
		active = false,
		ariaLabel
	}: {
		onclick: () => void;
		name: string;
		stroke?: string;
		title?: string;
		active?: boolean;
		ariaLabel?: string;
	} = $props();
</script>

<button
	type="button"
	{onclick}
	{title}
	aria-label={ariaLabel ?? title}
	aria-pressed={active}
	class={`click rounded-full border border-gray p-1.5 transition-colors ${active ? 'bg-accent' : 'bg-gray-glass hover:bg-gray'}`}
>
	<Icon {name} stroke={stroke ?? (active ? 'black' : undefined)} />
</button>
