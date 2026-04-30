<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { Form2 } from '$lib/components';
	import { confirmPasswordReset } from '$lib/functions/auth';
	import { passwordRule } from '$lib/functions/validators';
	import { i18n } from '$lib/i18n';

	let token = $state('');
	let password = $state('');
	let submitting = $state(false);

	onMount(() => {
		token = page.url.searchParams.get('token') ?? '';
	});

	async function submit() {
		if (!token) return;
		if (passwordRule(password)) return;
		submitting = true;
		try {
			const ok = await confirmPasswordReset(token, password);
			if (ok) goto('/');
		} finally {
			submitting = false;
		}
	}

	function onkeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') submit();
	}
</script>

<svelte:window {onkeydown} />

<div class="flex h-screen items-center justify-center">
	<div class="flex w-100 flex-col gap-3 p-4">
		<h1 class="text-xl">{i18n.t('modal.resetPassword')}</h1>
		{#if !token}
			<p class="text-red">{i18n.t('auth.resetTokenMissing')}</p>
			<button onclick={() => goto('/')} class="click rounded-lg border border-gray p-1"
				>{i18n.t('common.cancel')}</button
			>
		{:else}
			<p class="text-sm text-gray-300">{i18n.t('auth.resetNewPasswordHint')}</p>
			<Form2
				bind:value={password}
				icon="password"
				label={i18n.t('modal.newPassword')}
				validate={passwordRule}
				iType="password"
			/>
			<div class="mt-4 flex gap-2">
				<button onclick={() => goto('/')} class="click flex-1 rounded-lg border border-gray p-1"
					>{i18n.t('common.cancel')}</button
				>
				<button onclick={submit} disabled={submitting} class="click flex-1 rounded-lg bg-accent p-1"
					>{i18n.t('modal.save')}</button
				>
			</div>
		{/if}
	</div>
</div>
