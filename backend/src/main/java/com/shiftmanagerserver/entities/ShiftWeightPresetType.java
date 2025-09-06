package com.shiftmanagerserver.entities;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;


public enum ShiftWeightPresetType {
    IMMEDIATE("מיידי"),
    PLUS60("פלוס 60"),
    PLUS90("פלוס 90");


    private final String hebrewName;

    ShiftWeightPresetType(String hebrewName) {
        this.hebrewName = hebrewName;
    }

    @JsonValue
    public String getHebrewName() {
        return hebrewName;
    }

    @JsonCreator
    public static ShiftWeightPresetType fromHebrewName(String hebrewName) {
        for (ShiftWeightPresetType type : values()) {
            if (type.hebrewName.equals(hebrewName)) {
                return type;
            }
        }
        throw new IllegalArgumentException("Unknown Hebrew name: " + hebrewName);
    }
}
