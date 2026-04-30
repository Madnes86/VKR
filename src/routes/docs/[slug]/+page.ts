import { error } from '@sveltejs/kit';
import { docArticles } from '$lib/mocs/docs';
import type { PageLoad } from './$types';

// Чисто клиентская загрузка статьи: данные лежат в моках, ходить за
// ними по сети не нужно. Если slug не найден — 404, чтобы пользователь
// не оказался на пустой странице после битой ссылки из диаграммы.
export const load: PageLoad = ({ params }) => {
	const article = docArticles.find((a) => a.slug === params.slug);
	if (!article) {
		throw error(404, 'Статья не найдена');
	}
	return { article };
};
