package com.shiftmanagerserver.entities;

public class AssignedShift extends Shift {
    private String assignedUsername;
    private ShiftWeightPreset preset;

    public AssignedShift() {
        super();
    }

    public AssignedShift(String assignedUsername, Shift shift, ShiftWeightPreset preset) {
        super(shift.getDate(), shift.getType());
        this.assignedUsername = assignedUsername;
        this.preset = preset;
    }

    public String getAssignedUsername() {
        return assignedUsername;
    }

    public void setAssignedUsername(String assignedUsername) {
        this.assignedUsername = assignedUsername;
    }

    public ShiftWeightPreset getPreset() {
        return preset;
    }

    public void setPreset(ShiftWeightPreset preset) {
        this.preset = preset;
    }

}
