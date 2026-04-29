<script lang="ts">
    import { Icon, Form, Button, DropDown, Slider, Avatar } from "$lib/components";
    import { modalStore } from "$lib/stores/modal.svelte";
    import { userStore } from "$lib/stores/user.svelte";
    import { updateMe } from "$lib/functions/auth";
    import { emailRule, userRule } from "$lib/functions/validators";
    import { i18n, type Lang } from "$lib/i18n";
    import { diagramSettings, DIAGRAM_DEFAULTS } from "$lib/stores/diagram.svelte";

    let drops = $state([
        {items: ['EN', 'RU'], selected: i18n.lang.toUpperCase(), name: 'lang',  labelKey: 'settings.language'},
    ]);

    $effect(() => {
        const l = drops[0].selected.toLowerCase() as Lang;
        if (l !== i18n.lang) i18n.set(l);
    });

    let isAuth = $derived(userStore.isAuthenticated);
    let displayName = $derived(userStore.displayName);
    let email = $derived(userStore.email ?? '');
    let avatarUrl = $derived(userStore.avatar);

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

    // Persist diagram settings on every change. Эффект тут (а не в
    // конструкторе store) потому что Settings — единственное место,
    // где значения мутируются пользователем через слайдеры.
    $effect(() => {
        diagramSettings.spring;
        diagramSettings.gravity;
        diagramSettings.repulsion;
        diagramSettings.baseSize;
        diagramSettings.longLinkRatio;
        diagramSettings.restThreshold;
        diagramSettings.revealDelay;
        diagramSettings.persist();
    });

    const shortcuts = [
        { keys: ['Enter'],  labelKey: 'settings.shortcuts.searchEnter' },
        { keys: ['Esc'],    labelKey: 'settings.shortcuts.searchEscape' },
        { keys: ['Dbl-clk'],labelKey: 'settings.shortcuts.linkRename' },
        { keys: ['Enter'],  labelKey: 'settings.shortcuts.linkRenameSubmit' },
        { keys: ['Esc'],    labelKey: 'settings.shortcuts.contextClose' },
    ];
</script>

<div class="flex w-full items-center gap-2 flex-col p-2">
    <div class="flex w-full items-center gap-3 px-2 py-2">
        <Avatar src={avatarUrl} name={displayName} size={56} />
        <div class="flex flex-col min-w-0">
            <span class="font-semibold truncate">{displayName}</span>
            {#if isAuth}
                <span class="text-xs opacity-60 truncate">{email}</span>
            {:else}
                <span class="text-xs opacity-60">{i18n.t('settings.anonim')}</span>
            {/if}
        </div>
    </div>

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
        <Button onclick={openLogin} className="flex gap-2 p-1 m-1 text-accent w-full hover:bg-gray rounded-md">
            <Icon name="login" />
            <p>{i18n.t('settings.login')}</p>
        </Button>
    {/if}

    {#each drops as {items, name, labelKey}, i}
        <DropDown {items} bind:selectedItem={drops[i].selected} className="w-full">
            <div class="click flex w-full gap-3 items-center px-2 py-1 rounded-sm hover:bg-gray">
                <Icon {name}/>
                <p>{i18n.t(labelKey)}</p>
                <p>{drops[i].selected}</p>
            </div>
        </DropDown>
    {/each}

    <!-- ── Параметры диаграммы ────────────────────────────────────────── -->
    <details class="w-full mt-2 rounded-md border border-gray">
        <summary class="px-2 py-1 cursor-pointer select-none flex items-center gap-2 hover:bg-gray rounded-md">
            <Icon name="diagramm" />
            <span class="grow">{i18n.t('settings.diagram.title')}</span>
        </summary>
        <div class="flex flex-col gap-1 p-1">
            <Slider
                bind:value={diagramSettings.spring}
                min={0} max={0.05} step={0.0005}
                label={i18n.t('settings.diagram.spring')}
            />
            <Slider
                bind:value={diagramSettings.gravity}
                min={0} max={0.005} step={0.00005}
                label={i18n.t('settings.diagram.gravity')}
            />
            <Slider
                bind:value={diagramSettings.repulsion}
                min={0} max={2000} step={5}
                label={i18n.t('settings.diagram.repulsion')}
            />
            <Slider
                bind:value={diagramSettings.baseSize}
                min={20} max={500} step={5}
                label={i18n.t('settings.diagram.baseSize')}
            />
            <Slider
                bind:value={diagramSettings.longLinkRatio}
                min={1} max={10} step={0.1}
                label={i18n.t('settings.diagram.longLinkRatio')}
            />
            <Slider
                bind:value={diagramSettings.restThreshold}
                min={0.001} max={2} step={0.001}
                label={i18n.t('settings.diagram.restThreshold')}
            />
            <Slider
                bind:value={diagramSettings.revealDelay}
                min={0} max={1000} step={10}
                label={i18n.t('settings.diagram.revealDelay')}
            />
            <Button onclick={() => diagramSettings.reset()} className="flex gap-2 p-1 m-1 w-full hover:bg-gray rounded-md text-sm opacity-80">
                <Icon name="cross" />
                <p>{i18n.t('settings.diagram.reset')}</p>
            </Button>
        </div>
    </details>

    <!-- ── Горячие клавиши ────────────────────────────────────────────── -->
    <details class="w-full rounded-md border border-gray">
        <summary class="px-2 py-1 cursor-pointer select-none flex items-center gap-2 hover:bg-gray rounded-md">
            <Icon name="mouse" />
            <span class="grow">{i18n.t('settings.shortcuts.title')}</span>
        </summary>
        <div class="flex flex-col gap-1 p-2">
            {#each shortcuts as s}
                <div class="flex items-center justify-between gap-2 text-sm py-1">
                    <span class="opacity-80 grow">{i18n.t(s.labelKey)}</span>
                    <span class="flex gap-1">
                        {#each s.keys as k}
                            <kbd class="px-1.5 py-0.5 text-xs rounded border border-gray bg-gray-glass">{k}</kbd>
                        {/each}
                    </span>
                </div>
            {/each}
        </div>
    </details>
</div>
