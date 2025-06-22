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

    constructor() {
        makeAutoObservable(this);
    }

    async addConstraint(constraint: Constraint) {
        const url = `${config.API_BASE_URL}/constraints`;
        console.log('Adding constraint:', constraint);
        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(constraint)
            });
            if (res.ok) {
                this.constraints.push(constraint);
            }
        } catch (e) {
            console.error('Failed to add constraint to server', e);
        }
    }

    async removeConstraint(shift: Shift) {
        console.log('Removing constraint for shift:', shift);
        const url = `${config.API_BASE_URL}/constraints`;
        try {
            const res = await fetch(url, {
                method: 'DELETE',
                headers: {'Content-Type': 'application/json'},
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
        const url = `${config.API_BASE_URL}/constraints`;
        const res = await fetch(url);
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
