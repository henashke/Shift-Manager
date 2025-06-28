package com.shiftmanagerserver.entities;

public class ShiftWeight {
    private Day day;
    private ShiftType shiftType;
    private int weight;

    public ShiftWeight() {
    }

    public ShiftWeight(Day day, ShiftType shiftType, int weight) {
        this.day = day;
        this.shiftType = shiftType;
        this.weight = weight;
    }

    public Day getDay() {
        return day;
    }

    public void setDay(Day day) {
        this.day = day;
    }

    public ShiftType getShiftType() {
        return shiftType;
    }

    public void setShiftType(ShiftType shiftType) {
        this.shiftType = shiftType;
    }

    public int getWeight() {
        return weight;
    }

    public void setWeight(int weight) {
        this.weight = weight;
    }
}

