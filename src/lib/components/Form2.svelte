<script lang="ts">
	import { Icon } from '$lib/components';

	let {
		value = $bindable(),
		icon,
		label,
		iType = 'text',
		validate
	}: {
		value: string;
		icon: string;
		label?: string;
		iType?: string;
		validate?: (v: string) => string | null;
	} = $props();

	let show: boolean = $state(false);

	const clear = () => (value = '');

	let type: any = $derived(iType == 'password' ? (show ? 'text' : 'password') : iType);
	function toggleType() {
		show = !show;
	}

	let error = $derived(validate ? validate(value) : null);
</script>

<div class="flex w-full flex-col items-start gap-2">
	<h3>{label}</h3>
	<div class="flex w-full items-center gap-2 rounded-xl bg-black p-2">
		<Icon name={icon} />
		<input bind:value {type} class="h-6 w-full border-0 bg-transparent p-0 focus:outline-none" />

		{#if value.length > 3}
			<button onclick={clear} class="click rounded-sm p-1 hover:bg-gray">
				<Icon name="cross" />
			</button>
		{/if}
		{#if iType == 'password' && value.length > 0}
			<button onclick={toggleType} class="click rounded-sm p-1 hover:bg-gray">
				{#if type == 'password'}
					<Icon name="show" />
				{:else}
					<Icon name="eyeOff" />
				{/if}
			</button>
		{/if}
	</div>
	{#if error && error.length > 0}
		<p class="text-sm text-red">{error}</p>
	{/if}
</div>
