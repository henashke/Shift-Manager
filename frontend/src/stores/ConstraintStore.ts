// You can expand this store with actions to add/remove constraints as needed
import {makeAutoObservable} from 'mobx';
import {ConstraintType} from "../components/ConstraintTypeList";
import {sameShift, Shift} from "./ShiftStore";
import config from "../config";
import authStore from "./AuthStore";

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
        // Don't fetch automatically - will be called when needed
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
            }
        } catch (e) {
            console.error('Failed to save pending constraints', e);
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
    async removeConstraint(shift: Shift) {
        const removedFromPendingConstraints = this.removeConstraintPending(shift, authStore.username!);
        if (removedFromPendingConstraints) {
            return
        }
        const url = `${config.API_BASE_URL}/constraints`;
        try {
            const res = await fetch(url, {
                method: 'DELETE',
                headers: authStore.getAuthHeaders(),
                body: JSON.stringify({
                    userId: authStore.username,
                    date: shift.date,
                    shiftType: shift.type
                })
            });
            if (res.ok) {
                this.removeConstraintFromStore(shift);
            }
        } catch (e) {
            console.error('Failed to remove constraint from server', e);
        }
    }

    removeConstraintFromStore(shift: Shift) {
        this.constraints = this.constraints.filter(c => !(sameShift({
            date: c.shift.date,
            type: c.shift.type
        }, shift) && authStore.username === c.userId));
    }

    async fetchConstraint() {
        // Only fetch if authenticated
        if (!authStore.isAuthenticated()) {
            console.log('Not authenticated, skipping constraints fetch');
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
