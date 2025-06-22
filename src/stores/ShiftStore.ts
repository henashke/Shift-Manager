import {makeAutoObservable, runInAction} from 'mobx';
import config from "../config";


export interface User {
    id: string;
    name: string;
    score: number;
}
export type ShiftType = 'יום' | 'לילה';

export interface Shift {
    date: Date;
    type: ShiftType;
}

export interface AssignedShift extends Shift{
    userId: string;
}

export class ShiftStore {
    assignedShifts: AssignedShift[] = [];
    pendingAssignedShifts: AssignedShift[] = [];
    weekOffset = 0;
    loading = false;

    constructor() {
        makeAutoObservable(this);
        this.fetchShifts();
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
        this.loading = true;
        try {
            const response = await fetch(`${config.API_BASE_URL}/shifts`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
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

    assignUser = (shift: Shift, userId: string) => {
        const assignedShift = this.assignedShifts.find(assignedShift => sameShift(assignedShift, shift));
        if (assignedShift) {
            assignedShift.userId = userId;
            return;
        }
        this.assignedShifts.filter(s => !sameShift(s, shift)); //remove any existing shift with the same date and type
        const newShift: AssignedShift = {
            ...shift,
            userId: userId,
        };
        this.assignedShifts.push(newShift);
    };

    unassignUser = (shift: Shift) => {
        const pendingShiftToUnassign = this.pendingAssignedShifts.find(s => sameShift(s, shift));
        if(pendingShiftToUnassign) {
            this.pendingAssignedShifts = this.pendingAssignedShifts.filter(s => !sameShift(s, pendingShiftToUnassign));
            return;
        }
        this.assignedShifts = this.assignedShifts.filter(assignedShift => !sameShift(assignedShift, shift));
    };

    addUser = (name: string) => {
        // Use userStore to add users instead
        // This method can be removed or refactored if not needed
    };

    getAssignedShift = (shift: Shift): AssignedShift | undefined => {
        return this.assignedShifts.find(assignedShift => sameShift(assignedShift, shift));
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
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(this.pendingAssignedShifts),
            });
            if (!response.ok) throw new Error('Failed to save shifts');
            runInAction(() => {
                this.mergePendingToAssigned();
            });
        } catch (error) {
            runInAction(() => {
                this.loading = false;
            });
            // Optionally handle error (e.g., show notification)
            console.error(error);
        }
    };

    get hasPendingAssignments() {
        return this.pendingAssignedShifts.length > 0;
    }
}

const store = new ShiftStore();
export default store;
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
