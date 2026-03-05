<script lang="ts">
    import { Button, Form2 } from "$lib/components";
    let {
        show = $bindable(false),
    } : {
        show: boolean;
    } = $props();

    let ref: HTMLElement | null = $state(null);
    let user: string = $state('');
    let password: string = $state('');

    function close(e: MouseEvent) {
        if (e.target != ref) {
            show = false;
        }
    }
    

</script>

<button onclick={close} class="flex items-center justify-center absolute top-0 left-0 w-screen h-screen z-2 backdrop-blur-xs bg-gray-glass">
    <div bind:this={ref} class="w-100 flex gap-2 flex-col">
        <h3>Login</h3>
        <Form2 bind:value={user} icon="user" />
        <h3>Password</h3>
        <Form2 bind:value={password} icon="password" type="password" />
        <div class="flex w-full justify-between">
            <Button onclick={close}>Registration</Button>
            <Button onclick={close}>Authorization</Button>
        </div>
    </div>
</button>