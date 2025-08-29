import {makeAutoObservable, runInAction} from "mobx";
import config from "../config";
import authStore from "./AuthStore";
import notificationStore from "./NotificationStore";
import {ShiftWeightPreset} from "./ShiftWeightStore";

export interface User {
    name: string;
    score: number;
}

export type ShiftType = 'יום' | 'לילה';

export interface Shift {
    date: Date;
    type: ShiftType;
}

export interface AssignedShift extends Shift {
    assignedUsername: string;
    preset: ShiftWeightPreset;
}

export class ShiftStore {
    assignedShifts: AssignedShift[] = [];
    pendingAssignedShifts: AssignedShift[] = [];
    weekOffset = 0;
    loading = false;

    constructor() {
        makeAutoObservable(this);
        // Don't fetch automatically - will be called when needed
    }

    get weekDates() {
        const today = new Date();
        const start = new Date(today);
        start.setDate(today.getDate() - today.getDay() + this.weekOffset * 7);
        start.setHours(10);
        return Array.from({length: 7}, (_, i) => {
            const d = new Date(start);
            d.setDate(start.getDate() + i);
            return d;
        });
    }

    fetchShifts = async () => {
        // Only fetch if authenticated
        if (!authStore.isAuthenticated()) {
            return;
        }
        
        this.loading = true;
        try {
            const response = await fetch(`${config.API_BASE_URL}/shifts`, {
                method: 'GET',
                headers: authStore.getAuthHeaders(),
            });
            if (!response.ok) throw new Error('Failed to fetch shifts');
            const data = await response.json();
            runInAction(() => {
                this.assignedShifts = data.map((shift: any) => ({
                    ...shift,
                    date: new Date(shift.date)
                }));
                this.loading = false;
            });
        } catch (error) {
            runInAction(() => {
                this.assignedShifts = [];
                this.loading = false;
            });
            console.error(error);
        }
    };
    unassignUser = async (shift: Shift) => {
        const pendingShiftToUnassign = this.pendingAssignedShifts.find(s => sameShift(s, shift));
        if (pendingShiftToUnassign) {
            this.pendingAssignedShifts = this.pendingAssignedShifts.filter(s => !sameShift(s, pendingShiftToUnassign));
            return;
        }
        this.loading = true;
        try {
            const response = await fetch(`${config.API_BASE_URL}/shifts`, {
                method: 'DELETE',
                headers: authStore.getAuthHeaders(),
                body: JSON.stringify(shift),
            });
            if (!response.ok) throw new Error('Failed to unassign shift');
            runInAction(() => {
                this.assignedShifts = this.assignedShifts.filter(assignedShift => !sameShift(assignedShift, shift));
                this.loading = false;
            });
        } catch (error) {
            runInAction(() => {
                this.loading = false;
            });
            console.error(error);
        }
    };

    addUser = (name: string) => {
        // Use userStore to add users instead
        // This method can be removed or refactored if not needed
    };

    getAssignedShift = (shift: Shift): AssignedShift | undefined => {
        return this.assignedShifts.find(assignedShift => sameShift(assignedShift, shift));
    }

    getAssignedOrPendingShift = (shift: Shift): AssignedShift | undefined => {
        return this.pendingAssignedShifts.concat(this.assignedShifts).find(assignedShift => sameShift(assignedShift, shift));
    }

    setWeekOffset = (offset: number) => {
        this.weekOffset = offset;
        this.fetchShifts();
    }

    // Add a shift to the pending array
    assignShiftPending = (shift: AssignedShift) => {
        // Remove any existing pending assignment for the same shift (date+type)
        this.pendingAssignedShifts = this.pendingAssignedShifts.filter(s =>
            !(s.date.getTime() === shift.date.getTime() && s.type === shift.type)
        );
        this.pendingAssignedShifts.push(shift);
    };

    // Helper to merge pending shifts into assignedShifts
    mergePendingToAssigned = () => {
        this.pendingAssignedShifts.forEach(pending => {
            const idx = this.assignedShifts.findIndex(s =>
                s.date.getTime() === pending.date.getTime() && s.type === pending.type
            );
            if (idx !== -1) {
                this.assignedShifts[idx] = pending;
            } else {
                this.assignedShifts.push(pending);
            }
        });
        this.pendingAssignedShifts = [];
        this.loading = false;
    };

    // Save all pending assignments to the server
    savePendingAssignments = async () => {
        this.loading = true;
        try {
            const response = await fetch(`${config.API_BASE_URL}/shifts`, {
                method: 'POST',
                headers: authStore.getAuthHeaders(),
                body: JSON.stringify(this.pendingAssignedShifts),
            });
            if (!response.ok) {
                if (response.status === 403) {
                    notificationStore.showUnauthorizedError();
                } else {
                    // Try to show backend error message if available
                    let errorMsg = 'Failed to save shifts';
                    try {
                        const data = await response.json();
                        if (data && data.error) errorMsg = data.error;
                    } catch {}
                    notificationStore.showError(errorMsg);
                }
                return;
            }
            runInAction(() => {
                this.mergePendingToAssigned();
            });
        } catch (error) {
            runInAction(() => {
                this.loading = false;
            });
            notificationStore.showError('Failed to save shifts');
            console.error(error);
        }
    };

    // Suggest shift assignments for selected users
    async suggestShiftAssignments(userIds: string[], startDate: Date, endDate: Date) {
        this.loading = true;
        try {
            const response = await fetch(`${config.API_BASE_URL}/shifts/suggest`, {
                method: 'POST',
                headers: authStore.getAuthHeaders(),
                body: JSON.stringify({userIds, startDate, endDate}),
            });
            if (!response.ok) {
                if (response.status === 403) {
                    notificationStore.showUnauthorizedError();
                } else {
                    throw new Error('Failed to suggest shifts');
                }
                return;
            }
            const data = await response.json();
            runInAction(() => {
                this.pendingAssignedShifts = data.map((shift: any) => {
                    return ({
                        date: new Date(shift.date),
                        type: shift.type,
                        assignedUsername: shift.assignedUsername || ''
                    })
                });
                this.loading = false;
            });
        } catch (error) {
            runInAction(() => {
                this.loading = false;
            });
            console.error(error);
        }
    }

    // Reset all shifts for the displayed week
    resetWeeklyShifts = async (): Promise<'success' | 'error'> => {
        this.loading = true;
        try {
            const weekStart = this.weekDates[0];
            const response = await fetch(`${config.API_BASE_URL}/shifts/week`, {
                method: 'DELETE',
                headers: authStore.getAuthHeaders(),
                body: JSON.stringify({ weekStart: weekStart.toISOString().slice(0, 10) })
            });
            if (!response.ok) {
                if (response.status === 403) {
                    notificationStore.showUnauthorizedError();
                } else {
                    throw new Error('Failed to reset weekly shifts');
                }
                return 'error';
            }
            await this.fetchShifts();
            runInAction(() => {
                this.loading = false;
            });
            return 'success';
        } catch (error) {
            runInAction(() => {
                this.loading = false;
            });
            console.error(error);
            return 'error';
        }
    }

    recalculateScores = async (): Promise<'success' | 'error'> => {
        this.loading = true;
        try {
            const response = await fetch(`${config.API_BASE_URL}/shifts/recalculateAllUsersScores`, {
                method: 'POST',
                headers: authStore.getAuthHeaders(),
            });
            if (!response.ok) {
                if (response.status === 403) {
                    notificationStore.showUnauthorizedError();
                } else {
                    throw new Error('Failed to recalculate scores');
                }
                return 'error';
            }
            runInAction(() => {
                this.loading = false;
            });
            return 'success';
        } catch (error) {
            runInAction(() => {
                this.loading = false;
            });
            console.error(error);
            return 'error';
        }
    }
}

const store = new ShiftStore();
export const sameShift = (shift1: Shift, shift2: Shift) => {
    if (!shift1 || !shift2) return false;
    const date1 = new Date(shift1.date);
    const date2 = new Date(shift2.date);
    return (
        date1.getFullYear() === date2.getFullYear() &&
        date1.getMonth() === date2.getMonth() &&
        date1.getDate() === date2.getDate() &&
        shift1.type === shift2.type
    );
}
export default store;