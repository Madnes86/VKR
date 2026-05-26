/**
 * Базовый URL бэкенда (VKR-back).
 *
 * Локально подхватывается дефолт `http://127.0.0.1:8000`. На Vercel задайте
 * переменную окружения `VITE_API_URL` (Project → Settings → Environment
 * Variables) = публичный адрес бэка (туннель cloudflared/ngrok или хостинг).
 * Префикс VITE_ обязателен — иначе Vite не прокинет переменную в клиент.
 */
export const API_URL: string =
	import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000';
