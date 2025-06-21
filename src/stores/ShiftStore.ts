import {makeAutoObservable, runInAction} from 'mobx';
import {assign} from "mobx/dist/utils/utils";

export interface Konan {
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

export interface AssignedShift extends Shift {
    konanId: string;
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
        start.setHours(0, 0, 0, 0);
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
        //         const types = ['יום', 'לילה'] as const;
        //         const days: Day[] = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
        //         const weekDates = this.weekDates;
                this.assignedShifts = [];
        //         weekDates.forEach((date, i) => {
        //             types.forEach(type => {
        //                 this.assignedShifts.push({
        //                     date: date,
        //                     type,
        //                 });
        //             });
        //         });
                this.loading = false;
            });
        }, 500);
    };

    assignKonan = (shift: Shift, konanId: string) => {
        const assignedShift = this.assignedShifts.find(assigndShift => sameShift(assigndShift, shift));
        if (assignedShift) {
            assignedShift.konanId = konanId;
            return;
        }
        const newShift: AssignedShift = {
            ...shift,
            konanId: konanId,
        };
        console.log('Assigning new shift:', newShift);
        this.assignedShifts.push(newShift);
    };

    unassignKonan = (shift: Shift) => {
        this.assignedShifts = this.assignedShifts.filter(assignedShift => !sameShift(assignedShift, shift));
    };

    addKonan = (name: string) => {
        // Use konanimStore to add konanim instead
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

// HTTP handlers for real server requests (not used for now)
export async function httpGetKonanim() {
    const res = await fetch('http://localhost:8080/getKonanim');
    if (!res.ok) throw new Error('Failed to fetch konanim');
    return res.json();
}

export async function httpGetShifts(weekStartIso: string) {
    const res = await fetch(`http://localhost:8080/getShifts?weekStart=${encodeURIComponent(weekStartIso)}`);
    if (!res.ok) throw new Error('Failed to fetch shifts');
    return res.json();
}

export const sameShift = (shift1: Shift, shift2: Shift) => {
    if (!shift1 || !shift2) return false;
    return (
        shift1.date.getFullYear() === shift2.date.getFullYear() &&
        shift1.date.getMonth() === shift2.date.getMonth() &&
        shift1.date.getDate() === shift2.date.getDate() &&
        shift1.type === shift2.type
    );
}
