package com.shiftmanagerserver.entities;

public class AssignedShift extends Shift {
    private String userId;

    public AssignedShift() {
        super();
    }

    public AssignedShift(String userId, Shift shift) {
        super(shift.getDate(), shift.getType());
        this.userId = userId;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

}
