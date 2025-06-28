package com.shiftmanagerserver.entities;

public class Constraint {
    private Shift shift;
    private ConstraintType constraintType;
    private String userId;

    public Constraint() {
    }

    public Constraint(String userId, Shift shift) {
        this.userId = userId;
        this.shift = shift;
    }

    public Shift getShift() {
        return shift;
    }

    public void setShift(Shift shift) {
        this.shift = shift;
    }

    public ConstraintType getConstraintType() {
        return constraintType;
    }

    public void setConstraintType(ConstraintType constraintType) {
        this.constraintType = constraintType;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }
}