package com.shiftmanagerserver.entities;

import java.util.Map;

public class ShiftWeightSettings {
    private String currentPreset;
    private Map<String, ShiftWeightPreset> presets;

    public ShiftWeightSettings() {
    }

    public ShiftWeightSettings(String currentPreset, Map<String, ShiftWeightPreset> presets) {
        this.currentPreset = currentPreset;
        this.presets = presets;
    }

    public String getCurrentPreset() {
        return currentPreset;
    }

    public void setCurrentPreset(String currentPreset) {
        this.currentPreset = currentPreset;
    }

    public Map<String, ShiftWeightPreset> getPresets() {
        return presets;
    }

    public void setPresets(Map<String, ShiftWeightPreset> presets) {
        this.presets = presets;
    }
}
