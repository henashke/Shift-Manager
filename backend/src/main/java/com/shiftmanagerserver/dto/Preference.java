package com.shiftmanagerserver.dto;


public enum Preference {
    CANNOT(Integer.MIN_VALUE),
    PREFER_NOT(-1),
    PREFER(1);

    private final int priority;

    Preference(int priority) {
        this.priority = priority;
    }
}