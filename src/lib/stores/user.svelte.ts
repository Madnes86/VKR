const ADJECTIVES = [
	'Swift',
	'Silent',
	'Clever',
	'Bright',
	'Bold',
	'Quick',
	'Wise',
	'Calm',
	'Keen',
	'Fresh',
	'Sunny',
	'Misty',
	'Lucky',
	'Gentle',
	'Brave'
];
const ANIMALS = [
	'Fox',
	'Owl',
	'Wolf',
	'Raven',
	'Hawk',
	'Bear',
	'Lynx',
	'Otter',
	'Hare',
	'Crane',
	'Panda',
	'Seal',
	'Moose',
	'Heron',
	'Falcon'
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

export type AuthUser = {
	id: number;
	name: string;
	email: string;
	// URL аватарки. Бэкенд должен подтягивать из OAuth2-профиля
	// (Google/GitHub picture/avatar_url) и пробрасывать тут как
	// avatar_url; null — пользователь ничего не задал, фронт
	// отрисует дефолтную (фиолетовый круг с первой буквой имени).
	avatar_url?: string | null;
};

class UserStore {
	#id: number | null = $state(null);
	#name: string | null = $state(null);
	#email: string | null = $state(null);
	#avatar: string | null = $state(null);
	#anonName: string = $state('');

	constructor() {
		if (typeof localStorage === 'undefined') return;

		this.#id = readNumber('user_id');
		this.#name = localStorage.getItem('name');
		this.#email = localStorage.getItem('email');
		this.#avatar = localStorage.getItem('avatar_url');

		let anon = localStorage.getItem('anon_name');
		if (!anon) {
			anon = generateAnonName();
			localStorage.setItem('anon_name', anon);
		}
		this.#anonName = anon;
	}

	get id() {
		return this.#id;
	}
	get name() {
		return this.#name;
	}
	get email() {
		return this.#email;
	}
	get avatar() {
		return this.#avatar;
	}
	get anonName() {
		return this.#anonName;
	}
	get displayName() {
		return this.#name ?? this.#anonName;
	}
	get isAuthenticated() {
		return this.#name !== null;
	}

	setAuth(user: AuthUser, token: string) {
		localStorage.setItem('token', token);
		localStorage.setItem('user_id', String(user.id));
		localStorage.setItem('name', user.name);
		localStorage.setItem('email', user.email);
		if (user.avatar_url) localStorage.setItem('avatar_url', user.avatar_url);
		else localStorage.removeItem('avatar_url');
		this.#id = user.id;
		this.#name = user.name;
		this.#email = user.email;
		this.#avatar = user.avatar_url ?? null;
	}

	clearAuth() {
		localStorage.removeItem('token');
		localStorage.removeItem('user_id');
		localStorage.removeItem('name');
		localStorage.removeItem('email');
		localStorage.removeItem('avatar_url');
		this.#id = null;
		this.#name = null;
		this.#email = null;
		this.#avatar = null;
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
		if (patch.avatar_url !== undefined) {
			this.#avatar = patch.avatar_url;
			if (patch.avatar_url) localStorage.setItem('avatar_url', patch.avatar_url);
			else localStorage.removeItem('avatar_url');
		}
	}
}

export const userStore = new UserStore();
