// You can expand this store with actions to add/remove constraints as needed
import { makeAutoObservable } from 'mobx';
import {ConstraintType} from "../components/ConstraintTypeList";
import {ShiftType} from "./ShiftStore";

export type Constraint = {
  konanId: string;
  date: Date; // ISO date string
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

  removeConstraint(index: number) {
    this.constraints.splice(index, 1);
  }
}

export const constraintStore = new ConstraintStore();
