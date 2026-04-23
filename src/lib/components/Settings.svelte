<script lang="ts">
    import { Icon, Form, Toggle, Button, DropDown } from "$lib/components";
    import { modalStore } from "$lib/stores/modal.svelte";
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

    let auth: boolean = $state(false);
    let show: boolean = $state(false);

    let name: string = $derived(localStorage.getItem('name') ?? i18n.t('settings.anonim'));
    let email: string = $derived(localStorage.getItem('email') ?? '');

    function login() {
        modalStore.open('login');
        auth = true;
    }
    function logout() {
        modalStore.open('logout');
        auth = false;
    }
</script>

<div class="flex w-full items-center gap-2 flex-col p-2">
    {#if auth}
        <Form icon="user" text={name} />
        <Form icon="mail" text={email} />
        <Form icon="password" text={i18n.t('common.password')}/>
        <Button onclick={logout} className="flex gap-2 p-1 m-1 text-red w-full hover:bg-gray rounded-md">
            <Icon name="exit" />
            <p>{i18n.t('settings.exit')}</p>
        </Button>
    {:else}
        <Form icon="user" text={i18n.t('settings.anonim')}/>
        <Button onclick={login} className="flex gap-2 p-1 m-1 text-accent w-full hover:bg-gray rounded-md">
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
