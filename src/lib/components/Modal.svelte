<script lang="ts">
    import { Form2 } from "$lib/components";
    import { modalStore } from "$lib/stores/modal.svelte";
    import { register, login } from "$lib/functions/auth";
    import { i18n } from "$lib/i18n";

    let ref: HTMLElement | null = $state(null);
    let user: string = $state('');
    let mail: string = $state('');
    let password: string = $state('');

    function close() {
        modalStore.close();
        user = '';
        mail = '';
        password = '';
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

    function emailRule(v: string): string | null {
        if (!v|| v.length === 0) {
            return i18n.t('validate.email.required');
        }
        if (v.length < 5) {
            return i18n.t('validate.email.short');
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
            return i18n.t('validate.email.invalid');
        }
        return null;
    }
    function passwordRule(v: string): string | null {
        if (!v || v.length === 0) {
            return i18n.t('validate.password.required');
        }
        if (v.length < 6) {
            return i18n.t('validate.password.short');
        }
        if (!/[A-Z]/.test(v)) {
            return i18n.t('validate.password.upper');
        }
        if (!/[0-9]/.test(v)) {
            return i18n.t('validate.password.digit');
        }
        if (v.includes(' ')) {
            return i18n.t('validate.password.space');
        }
        return null;
    }
    function userRule(v: string): string | null {
        if (!v || v.length === 0) {
            return i18n.t('validate.user.required');
        }
        if (v.length < 3) {
            return i18n.t('validate.user.short');
        }
        if (v.length > 20) {
            return i18n.t('validate.user.long');
        }
        if (!/^[a-zA-Z0-9_]+$/.test(v)) {
            return i18n.t('validate.user.chars');
        }
        if (v.includes(' ')) {
            return i18n.t('validate.password.space');
        }
        return null;
    }
    async function onkeydown(e: KeyboardEvent) {
        if (e.key === 'Enter') {
            if (modalStore.type === 'login') {
                await login(mail, password); // добавили await
            } else if (modalStore.type === 'registration') {
                await register(user, mail, password);
            }
        }
    }

</script>

{#if modalStore.isOpen}
    <button {onkeydown} onclick={closeing} class="flex items-center justify-center fixed top-0 left-0 w-screen h-screen z-2 backdrop-blur-xs bg-gray-glass">
        <div bind:this={ref} class="size-100 p-2 flex gap-2 flex-col">
            {#if modalStore.type == 'login'}
                <Form2 bind:value={mail} icon="mail" label={i18n.t('common.email')} validate={emailRule} />
                <Form2 bind:value={password} icon="password" label={i18n.t('common.password')} validate={passwordRule} iType="password" />
                <button onclick={() => login(mail, password)} class="click mt-4 p-1 rounded-lg bg-accent">{i18n.t('modal.login')}</button>
                <div class="flex items-center gap-2">
                    <div class="w-full h-0.5 bg-gray"></div>
                    <span class="h-7">{i18n.t('common.or')}</span>
                    <div class="w-full h-0.5 bg-gray"></div>
                </div>
                <button onclick={goRegistration} class="click text-accent">{i18n.t('modal.createAccount')}</button>
            {:else if modalStore.type == 'logout'}
                <h1>{i18n.t('modal.logoutConfirm')}</h1>
                <button onclick={close} class="click rounded-sm p-2 bg-red text-white">{i18n.t('modal.leave')}</button>
            {:else if modalStore.type == 'registration'}
                <h1>{i18n.t('modal.registration')}</h1>
                <Form2 bind:value={user} icon="user" label={i18n.t('common.user')} validate={userRule} />
                <Form2 bind:value={mail} icon="mail" label={i18n.t('common.email')} validate={emailRule} />
                <Form2 bind:value={password} icon="password" label={i18n.t('common.password')} validate={passwordRule} iType="password" />
                <button onclick={() => register(user, mail, password)} class="click mt-4 p-1 rounded-lg bg-accent">{i18n.t('modal.registration')}</button>
                <div class="flex items-center gap-2">
                    <div class="w-full h-0.5 bg-gray"></div>
                    <span class="h-7">{i18n.t('common.or')}</span>
                    <div class="w-full h-0.5 bg-gray"></div>
                </div>
                <button onclick={goLogin} class="click text-accent">{i18n.t('modal.login')}</button>
            {/if}
        </div>
    </button>
{/if}
