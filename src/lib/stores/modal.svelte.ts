// lib/stores/modal.svelte.ts
import { SvelteMap } from 'svelte/reactivity';

// Типы для разных модальных окон
export type ModalType = 'login' | 'registration' | 'logout' | 'confirm';

// Интерфейс состояния модального окна
interface ModalState {
    isOpen: boolean;
    type: ModalType | null;
    data?: any; // Дополнительные данные для модалки
    onClose?: () => void; // Колбэк при закрытии
    onSuccess?: (result?: any) => void; // Колбэк при успехе
}

class ModalStore {
    // Используем реактивное состояние Svelte 5
    private state = $state<ModalState>({
        isOpen: false,
        type: null
    });
    
    // Для нескольких модальных окон (если нужны)
    private modals = new SvelteMap<string, ModalState>();
    
    // Геттеры для доступа к состоянию
    get isOpen() {
        return this.state.isOpen;
    }
    
    get type() {
        return this.state.type;
    }
    
    get data() {
        return this.state.data;
    }
    
    // Открыть модальное окно
    open(type: ModalType, data?: any, callbacks?: { onClose?: () => void; onSuccess?: () => void }) {
        this.state = {
            isOpen: true,
            type,
            data,
            ...callbacks
        };
        
        // Блокируем скролл body
        document.body.style.overflow = 'hidden';
    }
    
    // Закрыть модальное окно
    close() {
        if (this.state.onClose) {
            this.state.onClose();
        }
        
        this.state = {
            isOpen: false,
            type: null,
            data: null
        };
        
        // Возвращаем скролл
        document.body.style.overflow = '';
    }
    
    // Успешное завершение (например, после авторизации)
    success(result?: any) {
        if (this.state.onSuccess) {
            this.state.onSuccess(result);
        }
        this.close();
    }
    
    // Переключение состояния
    toggle(type: ModalType) {
        if (this.state.isOpen && this.state.type === type) {
            this.close();
        } else {
            this.open(type);
        }
    }
    
    // Сброс состояния
    reset() {
        this.state = {
            isOpen: false,
            type: null,
            data: null
        };
    }
}

// Создаем и экспортируем единственный экземпляр
export const modalStore = new ModalStore();