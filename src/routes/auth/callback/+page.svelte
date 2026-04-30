<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { userStore } from '$lib/stores/user.svelte';
	import { notificationStore } from '$lib/stores/notification.svelte';
	import { fetchMe } from '$lib/functions/auth';
	import { i18n } from '$lib/i18n';

	let status: 'pending' | 'error' = $state('pending');

	onMount(async () => {
		const hash = window.location.hash.startsWith('#')
			? window.location.hash.slice(1)
			: window.location.hash;
		const params = new URLSearchParams(hash);
		const error = params.get('error');
		const token = params.get('token');

		if (error) {
			status = 'error';
			notificationStore.error(`OAuth: ${error}`, 'error');
			setTimeout(() => goto('/'), 1500);
			return;
		}
		if (!token) {
			status = 'error';
			notificationStore.error('OAuth: missing token', 'error');
			setTimeout(() => goto('/'), 1500);
			return;
		}

		const user = await fetchMe(token);
		if (!user) {
			status = 'error';
			notificationStore.error(i18n.t('auth.loginFailed'), 'error');
			setTimeout(() => goto('/'), 1500);
			return;
		}

		userStore.setAuth(user, token);
		notificationStore.success(i18n.t('auth.loginSuccess'), 'check');
		// чистим чувствительный фрагмент из URL до редиректа
		history.replaceState(null, '', '/auth/callback');
		goto('/app');
	});
</script>

<div class="flex h-screen items-center justify-center">
	{#if status === 'pending'}
		<p>{i18n.t('auth.signingIn')}</p>
	{:else}
		<p>{i18n.t('auth.loginFailed')}</p>
	{/if}
</div>
