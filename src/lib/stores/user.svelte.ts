const ADJECTIVES = [
    'Swift', 'Silent', 'Clever', 'Bright', 'Bold', 'Quick', 'Wise',
    'Calm', 'Keen', 'Fresh', 'Sunny', 'Misty', 'Lucky', 'Gentle', 'Brave',
];
const ANIMALS = [
    'Fox', 'Owl', 'Wolf', 'Raven', 'Hawk', 'Bear', 'Lynx',
    'Otter', 'Hare', 'Crane', 'Panda', 'Seal', 'Moose', 'Heron', 'Falcon',
];

function pick<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

function generateAnonName(): string {
    const num = Math.floor(100 + Math.random() * 900);
    return `${pick(ADJECTIVES)}${pick(ANIMALS)}${num}`;
}

function readNumber(key: string): number | null {
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem(key);
    if (raw === null) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
}

export type AuthUser = { id: number; name: string; email: string };

class UserStore {
    #id: number | null = $state(null);
    #name: string | null = $state(null);
    #email: string | null = $state(null);
    #anonName: string = $state('');

    constructor() {
        if (typeof localStorage === 'undefined') return;

        this.#id = readNumber('user_id');
        this.#name = localStorage.getItem('name');
        this.#email = localStorage.getItem('email');

        let anon = localStorage.getItem('anon_name');
        if (!anon) {
            anon = generateAnonName();
            localStorage.setItem('anon_name', anon);
        }
        this.#anonName = anon;
    }

    get id() { return this.#id }
    get name() { return this.#name }
    get email() { return this.#email }
    get anonName() { return this.#anonName }
    get displayName() { return this.#name ?? this.#anonName }
    get isAuthenticated() { return this.#name !== null }

    setAuth(user: AuthUser, token: string) {
        localStorage.setItem('token', token);
        localStorage.setItem('user_id', String(user.id));
        localStorage.setItem('name', user.name);
        localStorage.setItem('email', user.email);
        this.#id = user.id;
        this.#name = user.name;
        this.#email = user.email;
    }

    clearAuth() {
        localStorage.removeItem('token');
        localStorage.removeItem('user_id');
        localStorage.removeItem('name');
        localStorage.removeItem('email');
        this.#id = null;
        this.#name = null;
        this.#email = null;
    }

    updateProfile(patch: Partial<AuthUser>) {
        if (patch.name !== undefined) {
            this.#name = patch.name;
            localStorage.setItem('name', patch.name);
        }
        if (patch.email !== undefined) {
            this.#email = patch.email;
            localStorage.setItem('email', patch.email);
        }
    }
}

export const userStore = new UserStore();
