package com.shiftmanagerserver.entities;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.Map;

public class ShiftWeightSettings {
    private ShiftWeightPreset currentPresetObject;
    private Map<String, ShiftWeightPreset> presets;

    public ShiftWeightSettings() {
    }

    @JsonCreator
    public ShiftWeightSettings(@JsonProperty("currentPresetObject") ShiftWeightPreset currentPresetObject, @JsonProperty("presets")Map<String, ShiftWeightPreset> presets) {
        this.presets = presets;
        this.currentPresetObject = currentPresetObject;
    }

    public ShiftWeightPreset getCurrentPresetObject() {
        return currentPresetObject;
    }

    public void setCurrentPresetObject(String currentPresetObject) {
        this.currentPresetObject = this.presets.get(currentPresetObject);
    }

    public Map<String, ShiftWeightPreset> getPresets() {
        return presets;
    }

    public void setPresets(Map<String, ShiftWeightPreset> presets) {
        this.presets = presets;
    }
}
