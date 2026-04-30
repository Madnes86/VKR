// Версия приложения, отображаемая в Stats. Держим как обычную
// константу, чтобы не тащить package.json в client-bundle и не
// зависеть от поведения Vite/SvelteKit при JSON-импортах.
// При выпуске билда обновляйте вручную, синхронизируя с package.json.
export const APP_VERSION = '0.0.1';
