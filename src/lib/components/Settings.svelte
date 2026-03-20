<script lang="ts">
    import { Icon, Form, Toggle, Button, DropDown } from "$lib/components";
    import { modalStore } from "$lib/stores/modal.svelte";

    let toggles: {power: boolean, text: string}[] = [
        {power: false, text: 'Hints'},
        {power: true, text: 'Play audio'}
    ];
    let drops = $state([
        {items: ['EN', 'RU'], selected: 'EN', name: 'lang',  label: 'Language'},
        {items: ['1', '2'],   selected: '1',  name: 'color', label: 'Accent color'}
    ]);

    let auth: boolean = $state(false);
    let show: boolean = $state(false);

    let name: string = $derived(localStorage.getItem('name') ?? 'anonim');
    let email: string = $derived(localStorage.getItem('email') ?? '');
    // let password: string = $derived(localStorage.getItem() ?? '')

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
        <Form icon="password" text="password"/>
        <Button onclick={logout} className="flex gap-2 p-1 m-1 text-red w-full hover:bg-gray rounded-md">
            <Icon name="exit" />
            <p>exit</p>
        </Button>
    {:else}
        <Form icon="user" text="anonim"/>
        <Button onclick={login} className="flex gap-2 p-1 m-1 text-accent w-full hover:bg-gray rounded-md">
            <Icon name="login" />
            <p>login</p>
        </Button>
    {/if}
    {#each toggles as {power, text}}
        <Toggle {power} {text} />
    {/each}
    {#each drops as {items, name, label}, i}
        <DropDown {items} bind:selectedItem={drops[i].selected} className="w-full">
            <div class="click flex w-full gap-3 items-center px-2 py-1 rounded-sm hover:bg-gray">
                <Icon {name}/>
                <p>{label}</p>
                <p>{drops[i].selected}</p>
            </div>
        </DropDown>
    {/each}
</div>