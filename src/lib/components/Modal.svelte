<script lang="ts">
    import { Form2, Notification } from "$lib/components";
    import { modalStore } from "$lib/stores/modal.svelte";
    import { notificationStore } from "$lib/stores/notification.svelte";

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

    function login() {
        if (emailRule(mail) === null && passwordRule(password) === null) {
            notificationStore.success('Success autorization', 'check');
            close();
        } else {
            alert('bad');
            notificationStore.error(passwordRule(password), 'error');
        }
    }
    function registration() {
        console.log(userRule(user));
        console.log(emailRule(mail));
        console.log(passwordRule(password));
        if (userRule(user) === null && emailRule(mail) === null && passwordRule(password) === null) {
            notificationStore.success('Success registration', 'check');
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
            return 'Email is required';
        }
        if (v.length < 5) {
            return 'Email is too short';
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
            return 'Invalid email format';
        }
        return null;
    }
    function passwordRule(v: string): string | null {
        if (!v || v.length === 0) {
            return 'Password is required';
        }
        if (v.length < 6) {
            return 'Minimum 6 characters';
        }
        if (!/[A-Z]/.test(v)) {
            return 'At least one uppercase letter';
        }
        if (!/[0-9]/.test(v)) {
            return 'At least one number';
        }
        if (v.includes(' ')) {
            return 'Spaces are not allowed';
        }
        return null;
    }
    function userRule(v: string): string | null {
        if (!v || v.length === 0) {
            return 'Username is required';
        }
        if (v.length < 3) {
            return 'Minimum 3 characters';
        }
        if (v.length > 20) {
            return 'Maximum 20 characters';
        }
        if (!/^[a-zA-Z0-9_]+$/.test(v)) {
            return 'Only letters, numbers and underscore';
        }
        if (v.includes(' ')) {
            return 'Spaces are not allowed';
        }
        return null;
    }

</script>

{#if modalStore.isOpen}
    <button onclick={closeing} class="flex items-center justify-center fixed top-0 left-0 w-screen h-screen z-2 backdrop-blur-xs bg-gray-glass">
        <div bind:this={ref} class="size-100 p-2 flex gap-2 flex-col">
            {#if modalStore.type == 'login'}
                <Form2 bind:value={mail} icon="mail" label="Email" validate={emailRule} />
                <Form2 bind:value={password} icon="password" label="Password" validate={passwordRule} iType="password" />
                <button onclick={login} class="click mt-4 p-1 rounded-lg bg-accent">Login</button>
                <div class="flex items-center gap-2">
                    <div class="w-full h-0.5 bg-gray"></div>
                    <span class="h-7">or</span>
                    <div class="w-full h-0.5 bg-gray"></div>
                </div>
                <button onclick={goRegistration} class="click text-accent">Create an account</button>
            {:else if modalStore.type == 'logout'}
                <h1>You realy wont logout</h1>
                <button onclick={close} class="click rounded-sm p-2 bg-red text-white">leave</button>
            {:else if modalStore.type == 'registration'}
                <h1>registration</h1>
                <Form2 bind:value={user} icon="user" label="User" validate={userRule} />
                <Form2 bind:value={mail} icon="mail" label="Email" validate={emailRule} />
                <Form2 bind:value={password} icon="password" label="Password" validate={passwordRule} iType="password" />
                <button onclick={registration} class="click mt-4 p-1 rounded-lg bg-accent">Registration</button>
                <div class="flex items-center gap-2">
                    <div class="w-full h-0.5 bg-gray"></div>
                    <span class="h-7">or</span>
                    <div class="w-full h-0.5 bg-gray"></div>
                </div>
                <button onclick={goLogin} class="click text-accent">Login</button>
            {/if}
        </div>
    </button>
{/if}
