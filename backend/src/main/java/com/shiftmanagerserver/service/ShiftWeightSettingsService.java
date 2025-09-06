package com.shiftmanagerserver.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.inject.Inject;
import com.google.inject.name.Named;
import com.shiftmanagerserver.dao.AsyncIO;
import com.shiftmanagerserver.entities.ShiftWeightPreset;
import com.shiftmanagerserver.entities.ShiftWeightSettings;
import io.vertx.core.Future;
import io.vertx.core.Promise;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ExecutionException;

public class ShiftWeightSettingsService {
    private static final Logger logger = LoggerFactory.getLogger(ShiftWeightSettingsService.class);
    private final ObjectMapper objectMapper;
    private final AsyncIO<ShiftWeightSettings, ShiftWeightSettings> settingsDao;
    private ShiftWeightSettings settings;
    private boolean initialized = false;

    @Inject
    public ShiftWeightSettingsService(ObjectMapper objectMapper,
                                      @Named("shift.weight.settings.dao") AsyncIO<ShiftWeightSettings, ShiftWeightSettings> settingsDao) {
        this.objectMapper = objectMapper;
        this.settingsDao = settingsDao;
        this.settings = new ShiftWeightSettings();
        // Don't load settings in constructor - wait for Redis to be ready
    }

    private Future<Void> loadSettingsAsync() {
        Promise<Void> promise = Promise.promise();

        settingsDao.read()
                .onSuccess(loadedSettings -> {
                    this.settings = loadedSettings;
                    logger.info("Successfully loaded shift weight settings from Redis");
                    promise.complete();
                })
                .onFailure(err -> {
                    logger.error("Error loading shift weight settings from Redis", err);
                    this.settings = new ShiftWeightSettings();
                    promise.complete(); // Complete with default settings rather than fail
                });

        return promise.future();
    }

    private Future<Void> saveSettingsAsync() {
        return settingsDao.write(settings)
                .onSuccess(v -> logger.info("Successfully saved shift weight settings to Redis"))
                .onFailure(err -> logger.error("Error saving shift weight settings to Redis", err));
    }

    public Future<ShiftWeightSettings> getSettings() {
        return loadSettingsAsync()
                .map(v -> settings)
                .onFailure(err -> logger.error("Error loading users", err));

    }

    public Future<Void> saveSettings(ShiftWeightSettings newSettings) {
        Promise<Void> promise = Promise.promise();
        Map<String, ShiftWeightPreset> filtered = new HashMap<>(newSettings.getPresets());
        filtered.remove("S");
        newSettings = new ShiftWeightSettings(newSettings.getCurrentPresetObject(), filtered);
        this.settings = newSettings;
        saveSettingsAsync()
                .onSuccess(promise::complete)
                .onFailure(promise::fail);
        return promise.future();
    }

    public Future<Void> addPreset(ShiftWeightPreset preset) {
        Promise<Void> promise = Promise.promise();

        if (!initialized) {
            loadSettingsAsync()
                    .onSuccess(v -> {
                        initialized = true;
                        proceedWithAddPreset(preset, promise);
                    })
                    .onFailure(err -> {
                        logger.error("Error loading settings", err);
                        promise.fail(err);
                    });
        } else {
            proceedWithAddPreset(preset, promise);
        }

        return promise.future();
    }

    private void proceedWithAddPreset(ShiftWeightPreset preset, Promise<Void> promise) {
        if (settings.getPresets() == null) {
            settings.setPresets(new java.util.HashMap<>());
        }
        settings.getPresets().put(preset.getName(), preset);

        saveSettingsAsync()
                .onSuccess(v -> promise.complete())
                .onFailure(err -> {
                    // Rollback on failure
                    settings.getPresets().remove(preset.getName());
                    promise.fail(err);
                });
    }

    public Future<Void> setCurrentPreset(String currentPreset) {
        Promise<Void> promise = Promise.promise();

        if (!initialized) {
            loadSettingsAsync()
                    .onSuccess(v -> {
                        initialized = true;
                        proceedWithSetCurrentPreset(currentPreset, promise);
                    })
                    .onFailure(err -> {
                        logger.error("Error loading settings", err);
                        promise.fail(err);
                    });
        } else {
            proceedWithSetCurrentPreset(currentPreset, promise);
        }

        return promise.future();
    }

    private void proceedWithSetCurrentPreset(String currentPreset, Promise<Void> promise) {
        settings.setCurrentPresetObject(currentPreset);

        saveSettingsAsync()
                .onSuccess(v -> promise.complete())
                .onFailure(promise::fail);
    }

    // Synchronous methods for backward compatibility
    public ShiftWeightSettings getSettingsSync() {
        try {
            return getSettings().toCompletionStage().toCompletableFuture().get();
        } catch (InterruptedException | ExecutionException e) {
            logger.error("Error in synchronous settings retrieval", e);
            return new ShiftWeightSettings();
        }
    }

    public void saveSettingsSync(ShiftWeightSettings newSettings) {
        try {
            saveSettings(newSettings).toCompletionStage().toCompletableFuture().get();
        } catch (InterruptedException | ExecutionException e) {
            logger.error("Error in synchronous settings save", e);
        }
    }

    public void addPresetSync(ShiftWeightPreset preset) {
        try {
            addPreset(preset).toCompletionStage().toCompletableFuture().get();
        } catch (InterruptedException | ExecutionException e) {
            logger.error("Error in synchronous preset addition", e);
        }
    }

    public void setCurrentPresetSync(String currentPreset) {
        try {
            setCurrentPreset(currentPreset).toCompletionStage().toCompletableFuture().get();
        } catch (InterruptedException | ExecutionException e) {
            logger.error("Error in synchronous current preset setting", e);
        }
    }
}
