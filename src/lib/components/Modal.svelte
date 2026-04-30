<script lang="ts">
	import { Form2 } from '$lib/components';
	import { modalStore } from '$lib/stores/modal.svelte';
	import {
		register,
		login,
		logout,
		updateMe,
		startOAuth,
		fetchProviders,
		requestPasswordReset,
		type OAuthProvider
	} from '$lib/functions/auth';
	import { emailRule, passwordRule, userRule } from '$lib/functions/validators';
	import { i18n } from '$lib/i18n';
	import googleIcon from '$lib/img/google-color.png';
	import yandexIcon from '$lib/img/yandex.webp';

	let ref: HTMLElement | null = $state(null);
	let user: string = $state('');
	let mail: string = $state('');
	let password: string = $state('');
	let currentPassword: string = $state('');
	let providers: Record<OAuthProvider, boolean> = $state({ google: false, yandex: false });

	$effect(() => {
		if (modalStore.isOpen && (modalStore.type === 'login' || modalStore.type === 'registration')) {
			fetchProviders().then((p) => (providers = p));
		}
	});

	function close() {
		modalStore.close();
		user = '';
		mail = '';
		password = '';
		currentPassword = '';
	}
	function closeing(e: MouseEvent) {
		if (!ref?.contains(e.target as Node)) {
			close();
		}
	}
	function goLogin() {
		close();
		modalStore.open('login');
	}
	function goRegistration() {
		close();
		modalStore.open('registration');
	}
	function goResetRequest() {
		close();
		modalStore.open('resetRequest');
	}

	async function submitPassword() {
		if (passwordRule(password)) return;
		if (!currentPassword) return;
		const ok = await updateMe({ password, current_password: currentPassword });
		if (ok) close();
	}
	async function submitResetRequest() {
		if (emailRule(mail)) return;
		const ok = await requestPasswordReset(mail);
		if (ok) close();
	}
	async function onkeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			if (modalStore.type === 'login') {
				await login(mail, password);
			} else if (modalStore.type === 'registration') {
				await register(user, mail, password);
			} else if (modalStore.type === 'password') {
				await submitPassword();
			} else if (modalStore.type === 'resetRequest') {
				await submitResetRequest();
			}
		}
	}
</script>

{#if modalStore.isOpen}
	<button
		{onkeydown}
		onclick={closeing}
		class="fixed top-0 left-0 z-2 flex h-screen w-screen items-center justify-center bg-gray-glass backdrop-blur-xs"
	>
		<div bind:this={ref} class="flex size-100 flex-col gap-2 p-2">
			{#snippet oauthButtons()}
				{#if providers.google || providers.yandex}
					<div class="flex w-full justify-center gap-3 p-2">
						{#if providers.google}
							<button
								onclick={() => startOAuth('google')}
								class="click size-8 overflow-hidden rounded-full"
							>
								<img src={googleIcon} alt="Google" class="w-full" />
							</button>
						{/if}
						{#if providers.yandex}
							<button
								onclick={() => startOAuth('yandex')}
								class="click size-8 overflow-hidden rounded-full"
							>
								<img src={yandexIcon} alt="Yandex" class="w-full" />
							</button>
						{/if}
					</div>
				{/if}
			{/snippet}

			{#if modalStore.type == 'login'}
				<Form2 bind:value={mail} icon="mail" label={i18n.t('common.email')} validate={emailRule} />
				<Form2
					bind:value={password}
					icon="password"
					label={i18n.t('common.password')}
					validate={passwordRule}
					iType="password"
				/>
				<button onclick={() => login(mail, password)} class="click mt-4 rounded-lg bg-accent p-1"
					>{i18n.t('modal.login')}</button
				>
				<button onclick={goResetRequest} class="click text-sm text-gray-300 hover:text-accent"
					>{i18n.t('modal.forgotPassword')}</button
				>
				{@render oauthButtons()}
				<div class="flex items-center gap-2">
					<div class="h-0.5 w-full bg-gray"></div>
					<span class="h-7">{i18n.t('common.or')}</span>
					<div class="h-0.5 w-full bg-gray"></div>
				</div>
				<button onclick={goRegistration} class="click text-accent"
					>{i18n.t('modal.createAccount')}</button
				>
			{:else if modalStore.type == 'logout'}
				<h1>{i18n.t('modal.logoutConfirm')}</h1>
				<div class="flex gap-2">
					<button onclick={close} class="click flex-1 rounded-sm border border-gray p-2"
						>{i18n.t('common.cancel')}</button
					>
					<button onclick={logout} class="click flex-1 rounded-sm bg-red p-2 text-white"
						>{i18n.t('modal.leave')}</button
					>
				</div>
			{:else if modalStore.type == 'password'}
				<h1>{i18n.t('modal.changePassword')}</h1>
				<Form2
					bind:value={currentPassword}
					icon="password"
					label={i18n.t('modal.currentPassword')}
					iType="password"
				/>
				<Form2
					bind:value={password}
					icon="password"
					label={i18n.t('modal.newPassword')}
					validate={passwordRule}
					iType="password"
				/>
				<div class="mt-4 flex gap-2">
					<button onclick={close} class="click flex-1 rounded-lg border border-gray p-1"
						>{i18n.t('common.cancel')}</button
					>
					<button onclick={submitPassword} class="click flex-1 rounded-lg bg-accent p-1"
						>{i18n.t('modal.save')}</button
					>
				</div>
			{:else if modalStore.type == 'resetRequest'}
				<h1>{i18n.t('modal.resetPassword')}</h1>
				<p class="text-sm text-gray-300">{i18n.t('modal.resetHint')}</p>
				<Form2 bind:value={mail} icon="mail" label={i18n.t('common.email')} validate={emailRule} />
				<div class="mt-4 flex gap-2">
					<button onclick={goLogin} class="click flex-1 rounded-lg border border-gray p-1"
						>{i18n.t('common.cancel')}</button
					>
					<button onclick={submitResetRequest} class="click flex-1 rounded-lg bg-accent p-1"
						>{i18n.t('modal.sendResetLink')}</button
					>
				</div>
			{:else if modalStore.type == 'registration'}
				<h1>{i18n.t('modal.registration')}</h1>
				<Form2 bind:value={user} icon="user" label={i18n.t('common.user')} validate={userRule} />
				<Form2 bind:value={mail} icon="mail" label={i18n.t('common.email')} validate={emailRule} />
				<Form2
					bind:value={password}
					icon="password"
					label={i18n.t('common.password')}
					validate={passwordRule}
					iType="password"
				/>
				<button
					onclick={() => register(user, mail, password)}
					class="click mt-4 rounded-lg bg-accent p-1">{i18n.t('modal.registration')}</button
				>
				{@render oauthButtons()}
				<div class="flex items-center gap-2">
					<div class="h-0.5 w-full bg-gray"></div>
					<span class="h-7">{i18n.t('common.or')}</span>
					<div class="h-0.5 w-full bg-gray"></div>
				</div>
				<button onclick={goLogin} class="click text-accent">{i18n.t('modal.login')}</button>
			{/if}
		</div>
	</button>
{/if}
