package com.shiftmanagerserver.handlers;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.inject.Inject;
import com.shiftmanagerserver.entities.User;
import com.shiftmanagerserver.service.UserService;
import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;
import io.vertx.ext.web.Router;
import io.vertx.ext.web.RoutingContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;

public class UserHandler implements Handler {
    private static final Logger logger = LoggerFactory.getLogger(UserHandler.class);
    private final UserService userService;
    private final ObjectMapper objectMapper;

    public UserHandler(UserService userService, com.fasterxml.jackson.databind.ObjectMapper objectMapper) {
        this.userService = userService;
        this.objectMapper = objectMapper;
    }

    public void getAllUsers(RoutingContext ctx) {
        userService.getAllUsers()
            .onSuccess(users -> {
                try {
                    JsonArray usersArray = new JsonArray(objectMapper.writeValueAsString(users));
                    ctx.response()
                            .putHeader("Content-Type", "application/json")
                            .end(usersArray.encode());
                } catch (Exception e) {
                    logger.error("Error serializing users", e);
                    ctx.response().setStatusCode(500).end();
                }
            })
            .onFailure(err -> {
                logger.error("Error fetching all users", err);
                ctx.response().setStatusCode(500).end();
            });
    }

    public void getUserById(RoutingContext ctx) {
        String id = ctx.pathParam("id");
        userService.getUserById(id)
            .onSuccess(user -> {
                if (user == null) {
                    ctx.response().setStatusCode(404).end();
                    return;
                }
                ctx.response()
                        .putHeader("Content-Type", "application/json")
                        .end(JsonObject.mapFrom(user).encode());
            })
            .onFailure(err -> {
                logger.error("Error fetching user by id", err);
                ctx.response().setStatusCode(500).end();
            });
    }

    public void createUser(RoutingContext ctx) {
        try {
            User user = objectMapper.readValue(ctx.body().asString(), User.class);
            userService.createUser(user)
                .onSuccess(success -> {
                    if (success) {
                        ctx.response()
                                .setStatusCode(201)
                                .putHeader("Content-Type", "application/json")
                                .end(JsonObject.mapFrom(user).encode());
                    } else {
                        ctx.response().setStatusCode(409).end("User already exists");
                    }
                })
                .onFailure(err -> {
                    logger.error("Error creating user", err);
                    ctx.response().setStatusCode(500).end();
                });
        } catch (Exception e) {
            logger.error("Error parsing user data", e);
            ctx.response().setStatusCode(400).end("Invalid user data");
        }
    }

    public void updateUser(RoutingContext ctx) {
        String id = ctx.pathParam("id");
        try {
            JsonObject updates = ctx.body().asJsonObject();
            userService.updateUser(id, updates)
                .onSuccess(updated -> {
                    if (updated == null) {
                        ctx.response().setStatusCode(404).end();
                        return;
                    }
                    ctx.response()
                            .putHeader("Content-Type", "application/json")
                            .end(JsonObject.mapFrom(updated).encode());
                })
                .onFailure(err -> {
                    logger.error("Error updating user", err);
                    ctx.response().setStatusCode(500).end();
                });
        } catch (Exception e) {
            logger.error("Error parsing update data", e);
            ctx.response().setStatusCode(400).end("Invalid update data");
        }
    }

    public void deleteUser(RoutingContext ctx) {
        String id = ctx.pathParam("id");
        
        // Permission check: only admin can delete users
        String role = ctx.user().principal().getString("role");
        if (!"admin".equals(role)) {
            ctx.response().setStatusCode(403).end("Admins only");
            return;
        }
        
        userService.deleteUser(id)
            .onSuccess(deleted -> {
                if (!deleted) {
                    ctx.response().setStatusCode(404).end();
                    return;
                }
                ctx.response().setStatusCode(204).end();
            })
            .onFailure(err -> {
                logger.error("Error deleting user", err);
                ctx.response().setStatusCode(500).end();
            });
    }

    @Override
    public void addRoutes(Router router) {
        router.get("/api/users").handler(this::getAllUsers);
        router.get("/api/users/:id").handler(this::getUserById);
        router.post("/api/users").handler(this::createUser);
        router.put("/api/users/:id").handler(this::updateUser);
        router.delete("/api/users/:id").handler(this::deleteUser);
    }
}
