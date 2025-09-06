package com.shiftmanagerserver.handlers;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.shiftmanagerserver.entities.*;
import com.shiftmanagerserver.service.ConstraintService;
import com.shiftmanagerserver.service.ShiftService;
import com.shiftmanagerserver.service.ShiftWeightSettingsService;
import com.shiftmanagerserver.service.UserService;
import io.vertx.core.Future;
import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;
import io.vertx.ext.web.RoutingContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.*;

public class ShiftHandler implements Handler {
    private static final Logger logger = LoggerFactory.getLogger(ShiftHandler.class);
    private final ShiftService shiftService;
    private final UserService userService;
    private final ConstraintService constraintService;
    private final ShiftWeightSettingsService shiftWeightSettingsService;
    private final ObjectMapper objectMapper;

    public ShiftHandler(com.shiftmanagerserver.service.ShiftService shiftService,
                        com.shiftmanagerserver.service.UserService userService,
                        com.shiftmanagerserver.service.ConstraintService constraintService,
                        com.shiftmanagerserver.service.ShiftWeightSettingsService shiftWeightSettingsService,
                        com.fasterxml.jackson.databind.ObjectMapper objectMapper) {
        this.shiftService = shiftService;
        this.userService = userService;
        this.constraintService = constraintService;
        this.shiftWeightSettingsService = shiftWeightSettingsService;
        this.objectMapper = objectMapper;
    }

    public void getAllShifts(RoutingContext ctx) {
        shiftService.getAllShifts()
                .onSuccess(shifts -> {
                    try {
                        JsonArray arr = new JsonArray(objectMapper.writeValueAsString(shifts));
                        ctx.response().putHeader("Content-Type", "application/json").end(arr.encode());
                    } catch (Exception e) {
                        logger.error("Error serializing shifts", e);
                        ctx.response().setStatusCode(500).end();
                    }
                })
                .onFailure(err -> {
                    logger.error("Error fetching all shifts", err);
                    ctx.response().setStatusCode(500).end();
                });
    }

    public void addShifts(RoutingContext ctx) {
        try {
            // Permission check: only admin can add shifts
            String role = ctx.user().principal().getString("role");
            if (!"admin".equals(role)) {
                ctx.response().setStatusCode(403).end("Admins only");
                return;
            }
            List<AssignedShift> shifts = objectMapper.readValue(ctx.body().asString(), objectMapper.getTypeFactory().constructCollectionType(List.class, AssignedShift.class));

            // Collect all usernames that are being assigned
            Set<String> usernames = new HashSet<>();
            for (AssignedShift assignedShift : shifts) {
                String username = assignedShift.getAssignedUsername();
                if (username != null && !username.isEmpty()) {
                    usernames.add(username);
                }
            }

            // For each username, fetch constraints asynchronously
            List<Future<?>> constraintFutures = new ArrayList<>();
            Map<String, AssignedShift> userToShift = new HashMap<>();
            for (AssignedShift assignedShift : shifts) {
                String username = assignedShift.getAssignedUsername();
                if (username != null && !username.isEmpty()) {
                    constraintFutures.add(constraintService.getConstraintsByUserId(username));
                    userToShift.put(username + assignedShift.getDate() + assignedShift.getType(), assignedShift);
                }
            }

            if (constraintFutures.isEmpty()) {
                // No assignments, just proceed
                shiftService.addShifts(shifts)
                        .onSuccess(v -> ctx.response().setStatusCode(201).end())
                        .onFailure(err -> {
                            logger.error("Error adding multiple shifts", err);
                            ctx.response().setStatusCode(400).end();
                        });
                return;
            }

            Future.all(constraintFutures).onSuccess(results -> {
                // Flatten all constraints and check for CANT
                int idx = 0;
                for (AssignedShift assignedShift : shifts) {
                    String username = assignedShift.getAssignedUsername();
                    if (username != null && !username.isEmpty()) {
                        @SuppressWarnings("unchecked")
                        List<com.shiftmanagerserver.entities.Constraint> constraints = (List<com.shiftmanagerserver.entities.Constraint>) results.result().list().get(idx);
                        boolean hasCant = constraints.stream().anyMatch(c ->
                                c.getConstraintType() == ConstraintType.CANT &&
                                        c.getShift().equals(assignedShift)
                        );
                        if (hasCant) {
                            ctx.response().setStatusCode(400)
                                    .putHeader("Content-Type", "application/json")
                                    .end(new JsonObject().put("error", "יש ל\"" + username + "\" אילוץ במשמרת הזו").encode());
                            return;
                        }
                        idx++;
                    }
                }
                // No CANT constraints found, proceed
                shiftService.addShifts(shifts)
                        .onSuccess(v -> ctx.response().setStatusCode(201).end())
                        .onFailure(err -> {
                            logger.error("Error adding multiple shifts", err);
                            ctx.response().setStatusCode(400).end();
                        });
            }).onFailure(err -> {
                logger.error("Error fetching constraints for users", err);
                ctx.response().setStatusCode(500).end("Error checking constraints");
            });
        } catch (Exception e) {
            logger.error("Error parsing shift data", e);
            ctx.response().setStatusCode(400).end("Invalid shift data");
        }
    }

    public void deleteShift(RoutingContext ctx) {
        try {
            // Permission check: only admin can delete shifts
            String role = ctx.user().principal().getString("role");
            if (!"admin".equals(role)) {
                ctx.response().setStatusCode(403).end("Admins only");
                return;
            }

            JsonObject body = ctx.body().asJsonObject();
            String dateStr = body.getString("date");
            String typeStr = body.getString("type");
            if (dateStr == null || typeStr == null) {
                ctx.response().setStatusCode(400).end();
                return;
            }
            Date date = objectMapper.getDateFormat().parse(dateStr);
            ShiftType type = ShiftType.fromHebrewName(typeStr);

            shiftService.deleteShift(date, type)
                    .onSuccess(deleted -> {
                        if (deleted) {
                            ctx.response().setStatusCode(200).end();
                        } else {
                            ctx.response().setStatusCode(404).end();
                        }
                    })
                    .onFailure(err -> {
                        logger.error("Error deleting shift", err);
                        ctx.response().setStatusCode(400).end();
                    });
        } catch (Exception e) {
            logger.error("Error parsing delete request", e);
            ctx.response().setStatusCode(400).end("Invalid request data");
        }
    }

    public void suggestShiftAssignment(RoutingContext ctx) {
        try {
            // Permission check: only admin can suggest shift assignments
            String role = ctx.user().principal().getString("role");
            if (!"admin".equals(role)) {
                ctx.response().setStatusCode(403).end("Admins only");
                return;
            }

            JsonObject body = ctx.body().asJsonObject();
            List<String> userIds = body.getJsonArray("userIds").getList();
            String startDateStr = body.getString("startDate");
            String endDateStr = body.getString("endDate");
            if (userIds == null || startDateStr == null || endDateStr == null) {
                ctx.response().setStatusCode(400).end();
                return;
            }
            Date startDate = objectMapper.getDateFormat().parse(startDateStr);
            Date endDate = objectMapper.getDateFormat().parse(endDateStr);
            List<Shift> relevantShifts = getAllShiftsBetween(startDate, endDate);

            // Create a composite future to get all users and constraints
            List<Future<User>> userFutures = new ArrayList<>();
            List<Future<List<Constraint>>> constraintFutures = new ArrayList<>();

            for (String userId : userIds) {
                userFutures.add(userService.getUserById(userId));
                constraintFutures.add(constraintService.getConstraintsByUserId(userId));
            }

            // Wait for all user futures to complete
            Future.all(userFutures)
                    .compose(usersResult -> {
                        List<User> users = usersResult.result().list();

                        // Wait for all constraint futures to complete
                        return Future.all(constraintFutures)
                                .compose(constraintsResult -> {
                                    List<List<Constraint>> allConstraints = constraintsResult.result().list();

                                    // Build the user-constraint map
                                    Map<User, List<Constraint>> userConstraintMap = new HashMap<>();
                                    for (int i = 0; i < users.size(); i++) {
                                        User user = users.get(i);
                                        List<Constraint> constraints = allConstraints.get(i);
                                        List<Constraint> constraintsForThisTimeFrame = constraints.stream()
                                                .filter(constraint -> relevantShifts.stream().anyMatch(shift -> shift.equals(constraint.getShift())))
                                                .toList();
                                        userConstraintMap.put(user, constraintsForThisTimeFrame);
                                    }

                                    // Suggest shift assignment
                                    return shiftService.suggestShiftAssignment(relevantShifts, userConstraintMap);
                                });
                    })
                    .onSuccess(suggestedShifts -> {
                        try {
                            String responseJson = objectMapper.writeValueAsString(suggestedShifts);
                            ctx.response()
                                    .setStatusCode(200)
                                    .putHeader("Content-Type", "application/json")
                                    .end(responseJson);
                        } catch (Exception e) {
                            logger.error("Error serializing suggested shifts", e);
                            ctx.response().setStatusCode(500).end();
                        }
                    })
                    .onFailure(err -> {
                        logger.error("Error in suggestShiftAssignment", err);
                        ctx.response().setStatusCode(400).end();
                    });
        } catch (Exception e) {
            logger.error("Error parsing suggest request", e);
            ctx.response().setStatusCode(400).end("Invalid request data");
        }
    }

    public List<Shift> getAllShiftsBetween(Date startDate, Date endDate) {
        List<Shift> shifts = new ArrayList<>();
        Calendar current = Calendar.getInstance();
        current.setTime(startDate);
        Calendar end = Calendar.getInstance();
        end.setTime(endDate);
        // Normalize end to the start of the day, but always include all shifts for the last day
        end.set(Calendar.HOUR_OF_DAY, 0);
        end.set(Calendar.MINUTE, 0);
        end.set(Calendar.SECOND, 0);
        end.set(Calendar.MILLISECOND, 0);

        while (true) {
            Date shiftDate = current.getTime();
            for (ShiftType type : ShiftType.values()) {
                shifts.add(new Shift(shiftDate, type));
            }
            if (current.get(Calendar.YEAR) == end.get(Calendar.YEAR) && current.get(Calendar.DAY_OF_YEAR) == end.get(Calendar.DAY_OF_YEAR)) {
                break;
            }
            current.add(Calendar.DAY_OF_MONTH, 1);
        }
        return shifts;
    }

    /**
     * Handler to delete all shifts for a specified week (Sunday–Saturday).
     * Expects JSON body: { "weekStart": "2024-06-16" }
     */
    public void deleteShiftsForWeek(RoutingContext ctx) {
        try {
            // Permission check: only admin can reset week
            String role = ctx.user().principal().getString("role");
            if (!"admin".equals(role)) {
                ctx.response().setStatusCode(403).end("Admins only");
                return;
            }

            JsonObject body = ctx.body().asJsonObject();
            String weekStartStr = body.getString("weekStart");
            if (weekStartStr == null) {
                ctx.response().setStatusCode(400).end("Missing weekStart");
                return;
            }
            Date weekStart = objectMapper.getDateFormat().parse(weekStartStr);
            shiftService.deleteShiftsForWeek(weekStart)
                    .onSuccess(deletedCount -> {
                        ctx.response()
                                .setStatusCode(200)
                                .putHeader("Content-Type", "application/json")
                                .end(new JsonObject().put("deleted", deletedCount).encode());
                    })
                    .onFailure(err -> {
                        logger.error("Error deleting weekly shifts", err);
                        ctx.response().setStatusCode(500).end();
                    });
        } catch (Exception e) {
            logger.error("Error parsing weekStart for delete", e);
            ctx.response().setStatusCode(400).end("Invalid weekStart");
        }
    }

    public void recalculateAllUsersScores(RoutingContext ctx) {
        try {
            // Permission check: only admin can recalculate shift scores
            String role = ctx.user().principal().getString("role");
            if (!"admin".equals(role)) {
                ctx.response().setStatusCode(403).end("Admins only");
                return;
            }

            shiftService.recalculateAllUserScores()
                    .onSuccess(v -> ctx.response().setStatusCode(200).end())
                    .onFailure(err -> {
                        logger.error("Error recalculating all shifts scores", err);
                        ctx.response().setStatusCode(500).end();
                    });
        } catch (Exception e) {
            logger.error("Error in recalculateAllShiftsScores", e);
            ctx.response().setStatusCode(400).end("Invalid request");
        }
    }

    @Override
    public void addRoutes(io.vertx.ext.web.Router router) {
        router.get("/api/shifts").handler(this::getAllShifts);
        router.post("/api/shifts").handler(this::addShifts);
        router.delete("/api/shifts").handler(this::deleteShift);
        router.delete("/api/shifts/week").handler(this::deleteShiftsForWeek); // updated
        router.post("/api/shifts/suggest").handler(this::suggestShiftAssignment);
        router.post("/api/shifts/recalculateAllUsersScores").handler(this::recalculateAllUsersScores);
    }
}
