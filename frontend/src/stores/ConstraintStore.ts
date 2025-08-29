import {makeAutoObservable} from 'mobx';
import {sameShift, Shift} from "./ShiftStore";
import config from "../config";
import authStore from "./AuthStore";
import notificationStore from "./NotificationStore";

export enum ConstraintType {
    CANT = 'לא יכול',
    PREFERS_NOT = 'מעדיף שלא',
    PREFERS = 'מעדיף'
}

export type Constraint = {
    userId: string;
    shift: Shift;
    constraintType: ConstraintType;
};

class ConstraintStore {
    constraints: Constraint[] = [];
    pendingConstraints: Constraint[] = [];

    constructor() {
        makeAutoObservable(this);
    }

    addConstraintPending(constraint: Constraint) {
        this.pendingConstraints = this.pendingConstraints.filter(c =>
            !(c.userId === constraint.userId && sameShift(c.shift, constraint.shift))
        );
        this.pendingConstraints.push(constraint);
    }

    removeConstraintPending(shift: Shift, userId: string): boolean {
        const initialSize = this.pendingConstraints.length;
        this.pendingConstraints = this.pendingConstraints.filter(c =>
            !(c.userId === userId && sameShift(c.shift, shift))
        );
        return initialSize !== this.pendingConstraints.length;
    }

    savePendingConstraints = async () => {
        if (this.pendingConstraints.length === 0) return;
        const url = `${config.API_BASE_URL}/constraints`;
        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: authStore.getAuthHeaders(),
                body: JSON.stringify(this.pendingConstraints)
            });
            if (res.ok) {
                this.mergePendingToConstraints();
                notificationStore.showSuccess('האילוצים נשמרו בהצלחה');
            } else if (res.status === 403) {
                notificationStore.showConstraintUnauthorizedError();
            } else {
                notificationStore.showError('שגיאה בשמירת האילוצים');
            }
        } catch (e) {
            console.error('Failed to save pending constraints', e);
            notificationStore.showError('שגיאה בשמירת האילוצים');
        }
    }

    mergePendingToConstraints() {
        this.pendingConstraints.forEach(pending => {
            const idx = this.constraints.findIndex(c =>
                c.userId === pending.userId && sameShift(c.shift, pending.shift)
            );
            if (idx !== -1) {
                this.constraints[idx] = pending;
            } else {
                this.constraints.push(pending);
            }
        });
        this.pendingConstraints = [];
    }

    get hasPendingConstraints() {
        return this.pendingConstraints.length > 0;
    }
    async removeConstraint(shift: Shift, userId?: string) {
        const targetUserId = userId || authStore.username!;
        const removedFromPendingConstraints = this.removeConstraintPending(shift, targetUserId);
        if (removedFromPendingConstraints) {
            return
        }
        const url = `${config.API_BASE_URL}/constraints`;
        try {
            const res = await fetch(url, {
                method: 'DELETE',
                headers: authStore.getAuthHeaders(),
                body: JSON.stringify({
                    userId: targetUserId,
                    date: shift.date,
                    shiftType: shift.type
                })
            });
            if (res.ok) {
                this.removeConstraintFromStore(shift, targetUserId);
                notificationStore.showSuccess('האילוץ נמחק בהצלחה');
            } else if (res.status === 403) {
                notificationStore.showConstraintUnauthorizedError();
            } else if (res.status === 404) {
                notificationStore.showError('האילוץ לא נמצא');
            } else {
                notificationStore.showError('שגיאה במחיקת האילוץ');
            }
        } catch (e) {
            console.error('Failed to remove constraint from server', e);
            notificationStore.showError('שגיאה במחיקת האילוץ');
        }
    }

    removeConstraintFromStore(shift: Shift, userId?: string) {
        const targetUserId = userId || authStore.username!;
        this.constraints = this.constraints.filter(c => !(sameShift({
            date: c.shift.date,
            type: c.shift.type
        }, shift) && targetUserId === c.userId));
    }

    async fetchConstraint() {
        if (!authStore.isAuthenticated()) {
            return;
        }
        
        const url = `${config.API_BASE_URL}/constraints`;
        const res = await fetch(url, {
            headers: authStore.getAuthHeaders()
        });
        if (!res.ok) throw new Error('Failed to fetch constraints');
        const json = await res.json();
        const data: Constraint[] = (json);
        this.constraints = data.map((c: Constraint) => ({
            ...c,
            date: new Date(c.shift.date)
        }));
    }
}

export const constraintStore = new ConstraintStore();
