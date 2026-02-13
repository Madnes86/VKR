<script lang="ts">
	import Form from "./Form.svelte";
    import Button from "./Button.svelte";
    import Icon from "./Icon.svelte";
	import Flex from "./Flex.svelte";

    let auth: boolean = $state(false);

    function login() {
        alert('login');
        auth = true;
    }
    function logout() {
        alert('logout');
        auth = false;
    }

</script>

{#if auth}
    <Flex col className="justify-start items-start">
        <Form icon="user" text="user"/>
        <Form icon="mail" text="pochta"/>
        <Form icon="password" text="password"/>
        <Button onclick={logout} className="flex gap-2 p-1 m-1 text-red w-full hover:bg-gray rounded-md">
            <Icon name="exit" />
            <p>exit</p>
        </Button>
    </Flex>
{:else}
    <Flex col className="justify-start items-start">
        <Form icon="user" text="anonim"/>
        <Button onclick={login} className="flex gap-2 p-1 m-1 text-accent w-full hover:bg-gray rounded-md">
            <Icon name="login" />
            <p>login</p>
        </Button>
    </Flex>
{/if}
