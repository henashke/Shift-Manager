package com.shiftmanagerserver.handlers;

import com.fasterxml.jackson.databind.ObjectMapper;
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

    public ConstraintHandler() {
        this.constraintService = new ConstraintService();
        this.objectMapper = new ObjectMapper();
    }

    public void handleCreateConstraint(RoutingContext ctx) {
        try {
            String body = ctx.body().asString();
            logger.info("Received create constraints request");

            // Try to parse as a list first
            List<Constraint> constraints = objectMapper.readValue(body, objectMapper.getTypeFactory().constructCollectionType(List.class, Constraint.class));
            constraintService.addConstraints(constraints);

            ctx.response()
                    .setStatusCode(201)
                    .putHeader("Content-Type", "application/json")
                    .end(new JsonObject().put("message", "Constraint(s) created successfully").encode());
        } catch (Exception e) {
            logger.error("Error creating constraint", e);
            handleError(ctx, e);
        }
    }

    public void handleGetConstraintsByUserId(RoutingContext ctx) {
        try {
            String userId = ctx.pathParam("userId");
            logger.info("Fetching constraints for userId: {}", userId);

            List<Constraint> constraints = constraintService.getConstraintsByUserId(userId);
            JsonArray constraintsArray = new JsonArray(objectMapper.writeValueAsString(constraints));

            ctx.response()
                    .putHeader("Content-Type", "application/json")
                    .end(constraintsArray.encode());
        } catch (Exception e) {
            logger.error("Error fetching constraints", e);
            handleError(ctx, e);
        }
    }

    public void handleGetAllConstraints(RoutingContext ctx) {
        try {
            List<Constraint> constraints = constraintService.getAllConstraints();
            JsonArray constraintsArray = new JsonArray(objectMapper.writeValueAsString(constraints));

            ctx.response()
                    .putHeader("Content-Type", "application/json")
                    .end(constraintsArray.encode());
        } catch (Exception e) {
            logger.error("Error fetching all constraints", e);
            handleError(ctx, e);
        }
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

            boolean deleted = constraintService.deleteConstraint(userId, new Shift(date, shiftType));
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
        } catch (Exception e) {
            logger.error("Error deleting constraint", e);
            handleError(ctx, e);
        }
    }

    private void handleError(RoutingContext ctx, Exception e) {
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
        router.post("/constraints").handler(this::handleCreateConstraint);
        router.get("/constraints").handler(this::handleGetAllConstraints);
        router.get("/constraints/user/:userId").handler(this::handleGetConstraintsByUserId);
        router.delete("/constraints").handler(this::handleDeleteConstraint);
    }
}
