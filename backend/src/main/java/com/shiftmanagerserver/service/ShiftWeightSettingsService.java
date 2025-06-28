package com.shiftmanagerserver.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.shiftmanagerserver.entities.ShiftWeightPreset;
import com.shiftmanagerserver.entities.ShiftWeightSettings;

import java.io.File;
import java.io.IOException;

public class ShiftWeightSettingsService {
    private static final String SETTINGS_FILE = "shift_weight_settings.json";
    private final ObjectMapper objectMapper = new ObjectMapper();
    private ShiftWeightSettings settings;

    public ShiftWeightSettingsService() {
        loadSettings();
    }

    public ShiftWeightSettings getSettings() {
        return settings;
    }

    public void saveSettings(ShiftWeightSettings newSettings) {
        this.settings = newSettings;
        saveToFile();
    }

    public void addPreset(ShiftWeightPreset preset) {
        if (settings.getPresets() == null) {
            settings.setPresets(new java.util.HashMap<>());
        }
        settings.getPresets().put(preset.getName(), preset);
        saveToFile();
    }

    public void setCurrentPreset(String currentPreset) {
        settings.setCurrentPreset(currentPreset);
        saveToFile();
    }

    private void loadSettings() {
        File file = new File(SETTINGS_FILE);
        if (file.exists()) {
            try {
                settings = objectMapper.readValue(file, ShiftWeightSettings.class);
            } catch (IOException e) {
                throw new RuntimeException("Failed to load shift weight settings", e);
            }
        } else {
            settings = new ShiftWeightSettings();
        }
    }

    private void saveToFile() {
        try {
            objectMapper.writeValue(new File(SETTINGS_FILE), settings);
        } catch (IOException e) {
            throw new RuntimeException("Failed to save shift weight settings", e);
        }
    }
}
