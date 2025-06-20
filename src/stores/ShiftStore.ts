import {makeAutoObservable, runInAction} from 'mobx';

export interface Konan {
    id: string;
    name: string;
    score: number;
}

export type Day = 'ראשון' | 'שני' | 'שלישי' | 'רביעי' | 'חמישי' | 'שישי' | 'שבת';
export type ShiftType = 'יום' | 'לילה';

export interface Shift {
    id: string;
    day: Day;
    date: string;
    type: ShiftType;
    konanId?: string;
}

export class ShiftStore {
    shifts: Shift[] = [];
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
                const types = ['יום', 'לילה'] as const;
                const days: Day[] = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
                const weekDates = this.weekDates;
                this.shifts = [];
                weekDates.forEach((date, i) => {
                    types.forEach(type => {
                        this.shifts.push({
                            id: `${date.toISOString()}-${type}`,
                            day: days[i],
                            date: date.toISOString(),
                            type,
                        });
                    });
                });
                this.loading = false;
            });
        }, 500);
    };

    assignKonan = (shiftId: string, konanId: string) => {
        const shift = this.shifts.find(s => s.id === shiftId);
        if (shift) {
            shift.konanId = konanId;
        }
    };

    unassignKonan = (shiftId: string) => {
        const shift = this.shifts.find(s => s.id === shiftId);
        if (shift) {
            shift.konanId = undefined;
        }
    };

    addKonan = (name: string) => {
        // Use konanimStore to add konanim instead
        // This method can be removed or refactored if not needed
    };

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
