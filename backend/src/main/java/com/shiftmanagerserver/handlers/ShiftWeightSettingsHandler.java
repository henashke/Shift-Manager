package com.shiftmanagerserver.handlers;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.shiftmanagerserver.entities.ShiftWeightPreset;
import com.shiftmanagerserver.entities.ShiftWeightSettings;
import com.shiftmanagerserver.service.ShiftWeightSettingsService;
import io.vertx.core.json.JsonObject;
import io.vertx.ext.web.Router;
import io.vertx.ext.web.RoutingContext;

public class ShiftWeightSettingsHandler implements Handler {
    private final ShiftWeightSettingsService service;
    private final ObjectMapper objectMapper;

    public ShiftWeightSettingsHandler() {
        this.service = new ShiftWeightSettingsService();
        this.objectMapper = new ObjectMapper();
    }

    public void handleGetSettings(RoutingContext ctx) {
        ShiftWeightSettings settings = service.getSettings();
        ctx.response()
                .putHeader("Content-Type", "application/json")
                .end(JsonObject.mapFrom(settings).encode());
    }

    public void handleSavePreset(RoutingContext ctx) {
        try {
            ShiftWeightPreset shiftWeightPreset = objectMapper.readValue(ctx.body().asString(), ShiftWeightPreset.class);
            service.addPreset(shiftWeightPreset);
            ctx.response()
                    .setStatusCode(200)
                    .putHeader("Content-Type", "application/json")
                    .end(new JsonObject().put("message", "Presets saved").encode());
        } catch (Exception e) {
            ctx.response()
                    .setStatusCode(400)
                    .putHeader("Content-Type", "application/json")
                    .end(new JsonObject().put("error", "Invalid data").encode());
        }
    }

    public void handleSetCurrentPreset(RoutingContext ctx) {
        try {
            JsonObject json = ctx.body().asJsonObject();
            String currentPreset = json.getString("currentPreset");
            if (currentPreset == null) throw new IllegalArgumentException();
            if (service.getSettings().getPresets().keySet().stream()
                    .noneMatch(presetName -> presetName.equals(currentPreset))) {
                throw new IllegalArgumentException("Preset not found");
            }
            service.setCurrentPreset(currentPreset);
            ctx.response()
                    .setStatusCode(200)
                    .putHeader("Content-Type", "application/json")
                    .end(new JsonObject().put("message", "Current preset set").encode());
        } catch (Exception e) {
            ctx.response()
                    .setStatusCode(400)
                    .putHeader("Content-Type", "application/json")
                    .end(new JsonObject().put("error", "Invalid data").encode());
        }
    }

    @Override
    public void addRoutes(Router router) {
        router.get("/shift-weight-settings").handler(this::handleGetSettings);
        router.post("/shift-weight-settings/preset").handler(this::handleSavePreset);
        router.post("/shift-weight-settings/current-preset").handler(this::handleSetCurrentPreset);
    }
}
