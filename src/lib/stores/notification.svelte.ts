// lib/stores/notification.svelte.ts
import { i18n } from '$lib/i18n';

interface Notification {
	id: string;
	icon: string;
	title: string;
	type: 'success' | 'error' | 'info' | 'warning';
	duration?: number;
}

const DEFAULT_DURATION = 10000;

class NotificationStore {
	private notifications = $state<Notification[]>([
		{
			id: '0',
			icon: 'check',
			title: i18n.t('notification.welcome'),
			type: 'success',
			duration: DEFAULT_DURATION
		}
	]);

	get all() {
		return this.notifications;
	}

	// Авто-закрытие отдано компоненту: он визуально показывает прогресс
	// и умеет паузиться по hover. Стора держит уведомление, пока
	// компонент не вызовет remove(id) через onClose. Иначе пауза в
	// компоненте конфликтовала бы с независимым таймером стора.
	show(notification: Omit<Notification, 'id'>) {
		const id = crypto.randomUUID();
		const newNotification = {
			...notification,
			id,
			duration: notification.duration ?? DEFAULT_DURATION
		};
		this.notifications = [...this.notifications, newNotification];
		return id;
	}

	success(title: string, icon = 'check', duration = DEFAULT_DURATION) {
		return this.show({ icon, title, type: 'success', duration });
	}

	error(title: string, icon = 'alert', duration = DEFAULT_DURATION) {
		return this.show({ icon, title, type: 'error', duration });
	}

	remove(id: string) {
		this.notifications = this.notifications.filter((n) => n.id !== id);
	}

	clear() {
		this.notifications = [];
	}
}

export const notificationStore = new NotificationStore();
