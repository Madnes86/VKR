import { dict, type Key, type Lang } from './dictionaries';

const STORAGE_KEY = 'lang';
const DEFAULT_LANG: Lang = 'ru';

function detect(): Lang {
	if (typeof localStorage === 'undefined') return DEFAULT_LANG;
	const saved = localStorage.getItem(STORAGE_KEY);
	if (saved && saved in dict) return saved as Lang;
	return DEFAULT_LANG;
}

class I18n {
	lang: Lang = $state(detect());

	set(l: Lang) {
		this.lang = l;
		if (typeof localStorage !== 'undefined') {
			localStorage.setItem(STORAGE_KEY, l);
		}
	}

	t(key: Key | string): string {
		const table = dict[this.lang] as Record<string, string>;
		return table[key] ?? String(key);
	}
}

export const i18n = new I18n();
export type { Lang, Key };
