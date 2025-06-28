package com.shiftmanagerserver.entities;

import java.util.Calendar;
import java.util.Date;
import java.util.UUID;

public class Shift {
    private UUID uuid = UUID.randomUUID();
    private Date date;
    private ShiftType type;
    public Shift() {
    }

    public void setUuid(UUID uuid) {
        this.uuid = uuid;
    }

    public Shift(Date date, ShiftType type) {
        this.date = date;
        this.type = type;
    }

    public UUID uuid() {
        return uuid;
    }

    public Date getDate() {
        return date;
    }

    public void setDate(Date date) {
        this.date = date;
    }

    public ShiftType getType() {
        return type;
    }

    public void setType(ShiftType type) {
        this.type = type;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null) return false;
        Shift shift = (Shift) o;
        if (type != shift.type) return false;
        if (date == null || shift.date == null) return false;
        Calendar cal1 = Calendar.getInstance();
        Calendar cal2 = Calendar.getInstance();
        cal1.setTime(date);
        cal2.setTime(shift.date);
        return cal1.get(Calendar.YEAR) == cal2.get(Calendar.YEAR)
                && cal1.get(Calendar.MONTH) == cal2.get(Calendar.MONTH)
                && cal1.get(Calendar.DAY_OF_MONTH) == cal2.get(Calendar.DAY_OF_MONTH);
    }
}