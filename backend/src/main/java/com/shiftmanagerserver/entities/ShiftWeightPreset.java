package com.shiftmanagerserver.entities;

import java.util.List;

public class ShiftWeightPreset {
    private String name;
    private List<ShiftWeight> weights;

    public ShiftWeightPreset() {
    }

    public ShiftWeightPreset(String name, List<ShiftWeight> weights) {
        this.name = name;
        this.weights = weights;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public List<ShiftWeight> getWeights() {
        return weights;
    }

    public void setWeights(List<ShiftWeight> weights) {
        this.weights = weights;
    }
}

