// You can expand this store with actions to add/remove constraints as needed
import { makeAutoObservable } from 'mobx';

export type Constraint = {
  konanId: string;
  date: string; // ISO date string
  shiftType: string;
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

