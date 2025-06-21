// You can expand this store with actions to add/remove constraints as needed
import { makeAutoObservable } from 'mobx';
import {ConstraintType} from "../components/ConstraintTypeList";
import {sameShift, Shift, ShiftType} from "./ShiftStore";

export type Constraint = {
  konanId: string;
  date: Date;
  shiftType: ShiftType;
  constraintType: ConstraintType;
};

class ConstraintStore {
  constraints: Constraint[] = [];

  constructor() {
    makeAutoObservable(this);
  }

  addConstraint(constraint: Constraint) {
    this.constraints.push(constraint);
  }

  removeConstraint(shift: Shift) {
    this.constraints = this.constraints.filter(c => !(sameShift({date: c.date, type: c.shiftType}, shift)));
  }
}

export const constraintStore = new ConstraintStore();
