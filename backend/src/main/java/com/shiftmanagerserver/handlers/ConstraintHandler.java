package com.shiftmanagerserver.handlers;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.inject.Inject;
import com.shiftmanagerserver.entities.Constraint;
import com.shiftmanagerserver.entities.Shift;
import com.shiftmanagerserver.entities.ShiftType;
import com.shiftmanagerserver.service.ConstraintService;
import io.vertx.core.http.HttpServerResponse;
import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;
import io.vertx.ext.web.Router;
import io.vertx.ext.web.RoutingContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Date;
import java.util.List;

public class ConstraintHandler implements Handler {
    private static final Logger logger = LoggerFactory.getLogger(ConstraintHandler.class);
    private final ConstraintService constraintService;
    private final ObjectMapper objectMapper;

    public ConstraintHandler(com.shiftmanagerserver.service.ConstraintService constraintService, com.fasterxml.jackson.databind.ObjectMapper objectMapper) {
        this.constraintService = constraintService;
        this.objectMapper = objectMapper;
    }

    public void handleCreateConstraint(RoutingContext ctx) {
        try {
            String body = ctx.body().asString();
            logger.info("Received create constraints request");

            // Try to parse as a list first
            List<Constraint> constraints = objectMapper.readValue(body, objectMapper.getTypeFactory().constructCollectionType(List.class, Constraint.class));

            // Permission check: only allow if all constraints are for the logged-in user, or user is admin
            String username = ctx.user().principal().getString("username");
            String role = ctx.user().principal().getString("role");
            boolean allSelf = constraints.stream().allMatch(c -> c.getUserId().equals(username));
            if (!"admin".equals(role) && !allSelf) {
                ctx.response().setStatusCode(403).end("Forbidden: can only edit your own constraints");
                return;
            }

            constraintService.addConstraints(constraints)
                .onSuccess(addedConstraints -> {
                    ctx.response()
                            .setStatusCode(201)
                            .putHeader("Content-Type", "application/json")
                            .end(new JsonObject().put("message", "Constraint(s) created successfully").encode());
                })
                .onFailure(err -> {
                    logger.error("Error creating constraint", err);
                    handleError(ctx, err);
                });
        } catch (Exception e) {
            logger.error("Error parsing constraint data", e);
            handleError(ctx, e);
        }
    }

    public void handleGetConstraintsByUserId(RoutingContext ctx) {
        try {
            String userId = ctx.pathParam("userId");
            logger.info("Fetching constraints for userId: {}", userId);

            constraintService.getConstraintsByUserId(userId)
                .onSuccess(constraints -> {
                    try {
                        JsonArray constraintsArray = new JsonArray(objectMapper.writeValueAsString(constraints));
                        ctx.response()
                                .putHeader("Content-Type", "application/json")
                                .end(constraintsArray.encode());
                    } catch (Exception e) {
                        logger.error("Error serializing constraints", e);
                        handleError(ctx, e);
                    }
                })
                .onFailure(err -> {
                    logger.error("Error fetching constraints", err);
                    handleError(ctx, err);
                });
        } catch (Exception e) {
            logger.error("Error processing request", e);
            handleError(ctx, e);
        }
    }

    public void handleGetAllConstraints(RoutingContext ctx) {
        constraintService.getAllConstraints()
            .onSuccess(constraints -> {
                try {
                    JsonArray constraintsArray = new JsonArray(objectMapper.writeValueAsString(constraints));
                    ctx.response()
                            .putHeader("Content-Type", "application/json")
                            .end(constraintsArray.encode());
                } catch (Exception e) {
                    logger.error("Error serializing constraints", e);
                    handleError(ctx, e);
                }
            })
            .onFailure(err -> {
                logger.error("Error fetching all constraints", err);
                handleError(ctx, err);
            });
    }

    public void handleDeleteConstraint(RoutingContext ctx) {
        try {
            JsonObject requestBody = ctx.body().asJsonObject();
            String userId = requestBody.getString("userId");
            String dateStr = requestBody.getString("date");
            String shiftTypeStr = requestBody.getString("shiftType");

            if (userId == null || dateStr == null || shiftTypeStr == null) {
                ctx.response()
                        .setStatusCode(400)
                        .putHeader("Content-Type", "application/json")
                        .end(new JsonObject()
                                .put("error", "Missing required fields: userId, date, and shiftType are required")
                                .encode());
                return;
            }

            // Permission check: only allow if user is admin or deleting their own constraint
            String username = ctx.user().principal().getString("username");
            String role = ctx.user().principal().getString("role");
            if (!"admin".equals(role) && !username.equals(userId)) {
                ctx.response().setStatusCode(403).end("Forbidden: can only delete your own constraints");
                return;
            }

            Date date;
            try {
                date = objectMapper.getDateFormat().parse(dateStr);
            } catch (Exception e) {
                ctx.response()
                        .setStatusCode(400)
                        .putHeader("Content-Type", "application/json")
                        .end(new JsonObject()
                                .put("error", "Invalid date format")
                                .encode());
                return;
            }

            ShiftType shiftType;
            try {
                shiftType = ShiftType.fromHebrewName(shiftTypeStr);
            } catch (IllegalArgumentException e) {
                ctx.response()
                        .setStatusCode(400)
                        .putHeader("Content-Type", "application/json")
                        .end(new JsonObject()
                                .put("error", "Invalid shift type")
                                .encode());
                return;
            }

            constraintService.deleteConstraint(userId, new Shift(date, shiftType))
                .onSuccess(deleted -> {
                    if (deleted) {
                        ctx.response()
                                .setStatusCode(200)
                                .putHeader("Content-Type", "application/json")
                                .end(new JsonObject()
                                        .put("message", "Constraint deleted successfully")
                                        .encode());
                    } else {
                        ctx.response()
                                .setStatusCode(404)
                                .putHeader("Content-Type", "application/json")
                                .end(new JsonObject()
                                        .put("error", "Constraint not found")
                                        .encode());
                    }
                })
                .onFailure(err -> {
                    logger.error("Error deleting constraint", err);
                    handleError(ctx, err);
                });
        } catch (Exception e) {
            logger.error("Error processing delete request", e);
            handleError(ctx, e);
        }
    }

    private void handleError(RoutingContext ctx, Throwable e) {
        HttpServerResponse response = ctx.response();
        response.setStatusCode(500)
                .putHeader("Content-Type", "application/json")
                .end(new JsonObject()
                        .put("error", "Internal Server Error")
                        .put("message", e.getMessage())
                        .encode());
    }

    @Override
    public void addRoutes(Router router) {
        router.post("/api/constraints").handler(this::handleCreateConstraint);
        router.get("/api/constraints").handler(this::handleGetAllConstraints);
        router.get("/api/constraints/user/:userId").handler(this::handleGetConstraintsByUserId);
        router.delete("/api/constraints").handler(this::handleDeleteConstraint);
    }
}
