package com.shiftmanagerserver.entities;

public class AssignedShift extends Shift {
    private String assignedUsername;

    public AssignedShift() {
        super();
    }

    public AssignedShift(String assignedUsername, Shift shift) {
        super(shift.getDate(), shift.getType());
        this.assignedUsername = assignedUsername;
    }

    public String getAssignedUsername() {
        return assignedUsername;
    }

    public void setAssignedUsername(String assignedUsername) {
        this.assignedUsername = assignedUsername;
    }

}
