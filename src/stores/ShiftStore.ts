import {makeAutoObservable, runInAction} from 'mobx';

export interface Employee {
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
    employeeId?: string;
}

export class ShiftStore {
    konanim: Employee[] = [];
    shifts: Shift[] = [];
    weekOffset = 0;
    loading = false;

    constructor() {
        makeAutoObservable(this);
        this.fetchEmployees();
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

    fetchEmployees = () => {
        this.loading = true;
        setTimeout(() => {
            runInAction(() => {
                this.konanim = [
                    {id: '1', name: 'Alice', score: 0},
                    {id: '2', name: 'Bob', score: 0},
                    {id: '3', name: 'Charlie', score: 0},
                    {id: '4', name: 'Diana', score: 0},
                    {id: '5', name: 'Eve', score: 0},
                ];
                this.loading = false;
            });
        }, 500);
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
    }

    assignEmployee = (shiftId: string, employeeId: string) => {
        const shift = this.shifts.find(s => s.id === shiftId);
        if (shift) {
            shift.employeeId = employeeId;
        }
    }

    unassignEmployee = (shiftId: string) => {
        const shift = this.shifts.find(s => s.id === shiftId);
        if (shift) {
            shift.employeeId = undefined;
        }
    }

    addEmployee = (name: string) => {
        const id = (Math.max(0, ...this.konanim.map(e => +e.id)) + 1).toString();
        this.konanim.push({id, name, score: 0});
    }

    setWeekOffset = (offset: number) => {
        this.weekOffset = offset;
        this.fetchShifts();
    }
}

const store = new ShiftStore();
export default store;

// HTTP handlers for real server requests (not used for now)
export async function httpGetEmployees() {
    const res = await fetch('http://localhost:8080/getEmployees');
    if (!res.ok) throw new Error('Failed to fetch employees');
    return res.json();
}

export async function httpGetShifts(weekStartIso: string) {
    const res = await fetch(`http://localhost:8080/getShifts?weekStart=${encodeURIComponent(weekStartIso)}`);
    if (!res.ok) throw new Error('Failed to fetch shifts');
    return res.json();
}
