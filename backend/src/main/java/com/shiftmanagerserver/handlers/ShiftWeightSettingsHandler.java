package com.shiftmanagerserver.handlers;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.inject.Inject;
import com.shiftmanagerserver.entities.ShiftWeightPreset;
import com.shiftmanagerserver.entities.ShiftWeightSettings;
import com.shiftmanagerserver.service.ShiftWeightSettingsService;
import io.vertx.core.json.JsonObject;
import io.vertx.ext.web.Router;
import io.vertx.ext.web.RoutingContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class ShiftWeightSettingsHandler implements Handler {
    private static final Logger logger = LoggerFactory.getLogger(ShiftWeightSettingsHandler.class);
    private final ShiftWeightSettingsService service;
    private final ObjectMapper objectMapper;

    public ShiftWeightSettingsHandler(com.shiftmanagerserver.service.ShiftWeightSettingsService service, com.fasterxml.jackson.databind.ObjectMapper objectMapper) {
        this.service = service;
        this.objectMapper = objectMapper;
    }

    public void handleGetSettings(RoutingContext ctx) {
        service.getSettings()
            .onSuccess(settings -> {
                ctx.response()
                        .putHeader("Content-Type", "application/json")
                        .end(JsonObject.mapFrom(settings).encode());
            })
            .onFailure(err -> {
                logger.error("Error getting settings", err);
                ctx.response()
                        .setStatusCode(500)
                        .putHeader("Content-Type", "application/json")
                        .end(new JsonObject().put("error", "Failed to get settings").encode());
            });
    }

    public void handleSavePreset(RoutingContext ctx) {
        try {
            // Permission check: only admin can save presets
            String role = ctx.user().principal().getString("role");
            if (!"admin".equals(role)) {
                ctx.response().setStatusCode(403).end("Admins only");
                return;
            }
            
            ShiftWeightPreset shiftWeightPreset = objectMapper.readValue(ctx.body().asString(), ShiftWeightPreset.class);
            
            service.addPreset(shiftWeightPreset)
                .onSuccess(v -> {
                    ctx.response()
                            .setStatusCode(200)
                            .putHeader("Content-Type", "application/json")
                            .end(new JsonObject().put("message", "Presets saved").encode());
                })
                .onFailure(err -> {
                    logger.error("Error saving preset", err);
                    ctx.response()
                            .setStatusCode(500)
                            .putHeader("Content-Type", "application/json")
                            .end(new JsonObject().put("error", "Failed to save preset").encode());
                });
        } catch (Exception e) {
            logger.error("Error parsing preset data", e);
            ctx.response()
                    .setStatusCode(400)
                    .putHeader("Content-Type", "application/json")
                    .end(new JsonObject().put("error", "Invalid data").encode());
        }
    }

    public void handleSetCurrentPreset(RoutingContext ctx) {
        try {
            // Permission check: only admin can set current preset
            String role = ctx.user().principal().getString("role");
            if (!"admin".equals(role)) {
                ctx.response().setStatusCode(403).end("Admins only");
                return;
            }
            
            JsonObject json = ctx.body().asJsonObject();
            String currentPreset = json.getString("currentPreset");
            if (currentPreset == null) throw new IllegalArgumentException();
            
            service.getSettings()
                .compose(settings -> {
                    if (settings.getPresets().keySet().stream()
                            .noneMatch(presetName -> presetName.equals(currentPreset))) {
                        throw new IllegalArgumentException("Preset not found");
                    }
                    return service.setCurrentPreset(currentPreset);
                })
                .onSuccess(v -> {
                    ctx.response()
                            .setStatusCode(200)
                            .putHeader("Content-Type", "application/json")
                            .end(new JsonObject().put("message", "Current preset set").encode());
                })
                .onFailure(err -> {
                    logger.error("Error setting current preset", err);
                    if (err instanceof IllegalArgumentException) {
                        ctx.response()
                                .setStatusCode(400)
                                .putHeader("Content-Type", "application/json")
                                .end(new JsonObject().put("error", err.getMessage()).encode());
                    } else {
                        ctx.response()
                                .setStatusCode(500)
                                .putHeader("Content-Type", "application/json")
                                .end(new JsonObject().put("error", "Failed to set current preset").encode());
                    }
                });
        } catch (Exception e) {
            logger.error("Error parsing current preset request", e);
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