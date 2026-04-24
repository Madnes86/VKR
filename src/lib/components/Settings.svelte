<script lang="ts">
    import { Icon, Form, Toggle, Button, DropDown } from "$lib/components";
    import { modalStore } from "$lib/stores/modal.svelte";
    import { userStore } from "$lib/stores/user.svelte";
    import { updateMe } from "$lib/functions/auth";
    import { emailRule, userRule } from "$lib/functions/validators";
    import { i18n, type Lang } from "$lib/i18n";

    let toggles = $derived([
        {power: false, text: i18n.t('settings.hints')},
        {power: true,  text: i18n.t('settings.audio')},
        {power: false, text: i18n.t('settings.rightMain')},
        {power: false, text: i18n.t('settings.viewPanel')}
    ]);
    let drops = $state([
        {items: ['EN', 'RU'], selected: i18n.lang.toUpperCase(), name: 'lang',  labelKey: 'settings.language'},
        {items: ['1', '2'],   selected: '1',                      name: 'color', labelKey: 'settings.accentColor'}
    ]);

    $effect(() => {
        const l = drops[0].selected.toLowerCase() as Lang;
        if (l !== i18n.lang) i18n.set(l);
    });

    let isAuth = $derived(userStore.isAuthenticated);
    let displayName = $derived(userStore.displayName);
    let email = $derived(userStore.email ?? '');

    function openLogin() {
        modalStore.open('login');
    }
    function openLogout() {
        modalStore.open('logout');
    }
    function openPasswordChange() {
        modalStore.open('password');
    }

    async function saveName(newName: string): Promise<boolean> {
        return await updateMe({ name: newName });
    }
    async function saveEmail(newEmail: string): Promise<boolean> {
        return await updateMe({ email: newEmail });
    }
</script>

<div class="flex w-full items-center gap-2 flex-col p-2">
    {#if isAuth}
        <Form icon="user" text={displayName} validate={userRule} onsave={saveName} />
        <Form icon="mail" text={email} validate={emailRule} onsave={saveEmail} />
        <Button onclick={openPasswordChange} className="flex gap-2 p-1 m-1 w-full hover:bg-gray rounded-md">
            <Icon name="password" stroke="red"/>
            <p class="text-red">{i18n.t('settings.changePassword')}</p>
        </Button>
        <Button onclick={openLogout} className="flex gap-2 p-1 m-1 text-red w-full hover:bg-gray rounded-md">
            <Icon name="exit" />
            <p>{i18n.t('settings.exit')}</p>
        </Button>
    {:else}
        <Form icon="user" text={displayName} />
        <Button onclick={openLogin} className="flex gap-2 p-1 m-1 text-accent w-full hover:bg-gray rounded-md">
            <Icon name="login" />
            <p>{i18n.t('settings.login')}</p>
        </Button>
    {/if}
    {#each toggles as {power, text}}
        <Toggle {power} {text} />
    {/each}
    {#each drops as {items, name, labelKey}, i}
        <DropDown {items} bind:selectedItem={drops[i].selected} className="w-full">
            <div class="click flex w-full gap-3 items-center px-2 py-1 rounded-sm hover:bg-gray">
                <Icon {name}/>
                <p>{i18n.t(labelKey)}</p>
                <p>{drops[i].selected}</p>
            </div>
        </DropDown>
    {/each}
</div>
