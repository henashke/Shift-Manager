import { makeAutoObservable, runInAction } from 'mobx';

export interface Employee {
  id: string;
  name: string;
}

export interface Shift {
  id: string;
  day: string; // e.g. 'Sunday'
  date: string; // ISO string
  type: 'Day' | 'Night';
  employeeId?: string;
}

export class ShiftStore {
  employees: Employee[] = [];
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
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }

  fetchEmployees = () => {
    this.loading = true;
    setTimeout(() => {
      runInAction(() => {
        this.employees = [
          { id: '1', name: 'Alice' },
          { id: '2', name: 'Bob' },
          { id: '3', name: 'Charlie' },
          { id: '4', name: 'Diana' },
          { id: '5', name: 'Eve' },
        ];
        this.loading = false;
      });
    }, 500);
  }

  fetchShifts = () => {
    this.loading = true;
    setTimeout(() => {
      runInAction(() => {
        const types = ['Day', 'Night'] as const;
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
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
    const id = (Math.max(0, ...this.employees.map(e => +e.id)) + 1).toString();
    this.employees.push({ id, name });
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
