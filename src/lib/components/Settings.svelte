<script lang="ts">
    import { Icon, Form, Toggle, Button, Modal } from "$lib/components";
    import { modalStore } from "$lib/stores/modal.svelte";

    let toggles: {power: boolean, text: string}[] = [
        {power: false, text: 'Hints'},
        {power: true, text: 'Display command cursors'},
        {power: true, text: 'Play audio'}
    ];

    let auth: boolean = $state(false);
    let show: boolean = $state(false);

    function login() {
        modalStore.open('login');
        auth = true; 
        console.log(modalStore.type);
        console.log(modalStore.isOpen);
    }
    function logout() {
        modalStore.open('logout');
        auth = false;
        console.log(modalStore.type);
        console.log(modalStore.isOpen);
    }
</script>

<div class="flex w-full items-center gap-2 flex-col p-2">
    <!-- <div class="flex flex-col w-full gap-2 justify-start items-start"> -->
        {#if auth}
            <Form icon="user" text="user"/>
            <Form icon="mail" text="pochta"/>
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
    <!-- </div> -->
    {#each toggles as {power, text}}
        <Toggle {power} {text} />
    {/each}
    <h1>SELECTED lang</h1>
</div>