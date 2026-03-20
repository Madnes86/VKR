import { notificationStore } from "$lib/stores/notification.svelte";
import { modalStore } from "$lib/stores/modal.svelte";

const BASE_URL: string = 'http://127.0.0.1:8000';

export async function updateMe(data: object) { // Надобы интерфейс добавить
    const token = localStorage.getItem('token');
    
    if (!token) {
        console.error("No token found");
        notificationStore.error("No token found", 'error');
    }

    const response = await fetch(`${BASE_URL}/users/me`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
    });

    if (response.ok) {
        notificationStore.success('Profile updated!', 'check');
    } else {
        const error = await response.json();
        notificationStore.error(error.detail, 'error');
    }
}

export async function login(email: string, password: string) {
    const response = await fetch(`${BASE_URL}/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            email: email,
            password: password
        })
    });

    if (response.ok) {
        const data = await response.json();
        notificationStore.success('Success login', 'check');
        console.log(data);
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('name', data.user.name);
        localStorage.setItem('email', data.user.email);
        modalStore.close();
    } else {
        const errorData = await response.json();
        notificationStore.error(errorData.detail[0].msg, 'error');
    }
}

export async function register(name: string, email: string, password: string) {
    const response = await fetch(`${BASE_URL}/register`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            name: name,
            email: email,
            password: password
        })
    });

    if (response.ok) {
        const data = await response.json();
        notificationStore.success('Success register', 'check');
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('name', data.user.name);
        localStorage.setItem('email', data.user.email);
        modalStore.close();
    } else {
        const errorData = await response.json();
        notificationStore.error(errorData.detail[0].msg, 'error');
    }
}