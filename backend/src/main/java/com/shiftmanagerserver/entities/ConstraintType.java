package com.shiftmanagerserver.entities;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum ConstraintType {
    CANT("לא יכול"),
    PREFERS_NOT("מעדיף שלא"),
    PREFERS("מעדיף");

    private final String hebrewName;

    ConstraintType(String hebrewName) {
        this.hebrewName = hebrewName;
    }

    @JsonValue
    public String getHebrewName() {
        return hebrewName;
    }

    @JsonCreator
    public static ConstraintType fromHebrewName(String hebrewName) {
        for (ConstraintType type : values()) {
            if (type.hebrewName.equals(hebrewName)) {
                return type;
            }
        }
        throw new IllegalArgumentException("Unknown ConstraintType: " + hebrewName);
    }
}