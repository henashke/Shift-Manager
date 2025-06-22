import {makeAutoObservable, runInAction} from 'mobx';

export interface User {
    id: string;
    name: string;
    score: number;
}

export type Day = 'ראשון' | 'שני' | 'שלישי' | 'רביעי' | 'חמישי' | 'שישי' | 'שבת';
export type ShiftType = 'יום' | 'לילה';

export interface Shift {
    date: Date;
    type: ShiftType;
}

export interface AssignedShift extends Shift{
    userId?: string;
}

export class ShiftStore {
    assignedShifts: AssignedShift[] = [];
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

    fetchShifts = () => {
        this.loading = true;
        setTimeout(() => {
            runInAction(() => {
                this.assignedShifts = [];
                this.loading = false;
            });
        }, 500);
    };

    assignUser = (shift: Shift, userId: string) => {
        const assignedShift = this.assignedShifts.find(assigndShift => sameShift(assigndShift, shift));
        if (assignedShift) {
            assignedShift.userId = userId;
            return;
        }
        const newShift: AssignedShift = {
            ...shift,
            userId: userId,
        };
        this.assignedShifts.push(newShift);
    };

    unassignUser = (shift: Shift) => {
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
}

const store = new ShiftStore();
export default store;

export async function httpGetUsers() {
    const res = await fetch('http://localhost:8080/getUsers');
    if (!res.ok) throw new Error('Failed to fetch users');
    return res.json();
}

export async function httpGetShifts(weekStartIso: string) {
    const res = await fetch(`http://localhost:8080/getShifts?weekStart=${encodeURIComponent(weekStartIso)}`);
    if (!res.ok) throw new Error('Failed to fetch shifts');
    return res.json();
}

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
