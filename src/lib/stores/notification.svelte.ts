// lib/stores/notification.svelte.ts
import { i18n } from "$lib/i18n";

interface Notification {
    id: string;
    icon: string;
    title: string;
    type: 'success' | 'error' | 'info' | 'warning';
    duration?: number;
}

class NotificationStore {
    private notifications = $state<Notification[]>([
        {id: '0', icon: 'check', title: i18n.t('notification.welcome'), type: 'success', duration: 3000}
    ]);
    
    get all() {
        return this.notifications;
    }
    
    show(notification: Omit<Notification, 'id'>) {
        const id = crypto.randomUUID();
        const newNotification = {
            ...notification,
            id,
            duration: notification.duration || 3000
        };
        
        this.notifications = [...this.notifications, newNotification];
        
        // Авто-закрытие
        setTimeout(() => {
            this.remove(id);
        }, newNotification.duration);
        
        return id;
    }
    
    success(title: string, icon = 'check', duration = 3000) {
        return this.show({ icon, title, type: 'success', duration });
    }
    
    error(title: string, icon = 'alert', duration = 3000) {
        return this.show({ icon, title, type: 'error', duration });
    }
    
    remove(id: string) {
        this.notifications = this.notifications.filter(n => n.id !== id);
    }
    
    clear() {
        this.notifications = [];
    }
}

export const notificationStore = new NotificationStore();