package com.shiftmanagerserver.entities;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum ShiftType {
    DAY("יום"),
    NIGHT("לילה");

    private final String hebrewName;

    ShiftType(String hebrewName) {
        this.hebrewName = hebrewName;
    }

    @JsonValue
    public String getHebrewName() {
        return hebrewName;
    }

    @JsonCreator
    public static ShiftType fromHebrewName(String hebrewName) {
        for (ShiftType type : values()) {
            if (type.hebrewName.equals(hebrewName)) {
                return type;
            }
        }
        throw new IllegalArgumentException("Unknown Hebrew name: " + hebrewName);
    }
}