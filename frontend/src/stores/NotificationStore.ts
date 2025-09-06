import {makeAutoObservable} from 'mobx';

export interface Notification {
    id: string;
    message: string;
    type: 'error' | 'success' | 'warning';
    duration?: number;
}

class NotificationStore {
    notifications: Notification[] = [];

    constructor() {
        makeAutoObservable(this);
    }

    addNotification(message: string, type: 'error' | 'success' | 'warning' = 'error', duration: number = 5000) {
        const notification: Notification = {
            id: Date.now().toString(),
            message,
            type,
            duration
        };
        this.notifications.push(notification);

        // Auto-remove notification after duration
        if (duration > 0) {
            setTimeout(() => {
                this.removeNotification(notification.id);
            }, duration);
        }
    }

    removeNotification(id: string) {
        this.notifications = this.notifications.filter(n => n.id !== id);
    }

    showUnauthorizedError() {
        this.addNotification('פעולה זו נעשית רק על ידי אחראי מערכת', 'error');
    }

    showConstraintUnauthorizedError() {
        this.addNotification('אי אפשר למחוק\\להוסיף אילוצים של כונן אחר', 'error');
    }

    showError(message: string) {
        this.addNotification(message, 'error');
    }

    showSuccess(message: string) {
        this.addNotification(message, 'success');
    }

    showWarning(message: string) {
        this.addNotification(message, 'warning');
    }

    clearAll() {
        this.notifications = [];
    }
}

const notificationStore = new NotificationStore();
export default notificationStore; 