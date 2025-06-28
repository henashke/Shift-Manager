package com.shiftmanagerserver.handlers;

import com.fasterxml.jackson.databind.ObjectMapper;
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

    public UserHandler() {
        this.userService = new UserService();
        this.objectMapper = new ObjectMapper();
    }

    public void getAllUsers(RoutingContext ctx) {
        try {
            List<User> users = userService.getAllUsers();
            JsonArray usersArray = new JsonArray(objectMapper.writeValueAsString(users));
            ctx.response()
                    .putHeader("Content-Type", "application/json")
                    .end(usersArray.encode());
        } catch (Exception e) {
            logger.error("Error fetching all users", e);
            ctx.response().setStatusCode(500).end();
        }
    }

    public void getUserById(RoutingContext ctx) {
        String id = ctx.pathParam("id");
        try {
            User user = userService.getUserById(id);
            if (user == null) {
                ctx.response().setStatusCode(404).end();
                return;
            }
            ctx.response()
                    .putHeader("Content-Type", "application/json")
                    .end(JsonObject.mapFrom(user).encode());
        } catch (Exception e) {
            logger.error("Error fetching user by id", e);
            ctx.response().setStatusCode(500).end();
        }
    }

    public void createUser(RoutingContext ctx) {
        try {
            User user = objectMapper.readValue(ctx.body().asString(), User.class);
            userService.createUser(user);
            ctx.response()
                    .setStatusCode(201)
                    .putHeader("Content-Type", "application/json")
                    .end(JsonObject.mapFrom(user).encode());
        } catch (Exception e) {
            logger.error("Error creating user", e);
            ctx.response().setStatusCode(500).end();
        }
    }

    public void updateUser(RoutingContext ctx) {
        String id = ctx.pathParam("id");
        try {
            JsonObject updates = ctx.body().asJsonObject();
            User updated = userService.updateUser(id, updates);
            if (updated == null) {
                ctx.response().setStatusCode(404).end();
                return;
            }
            ctx.response()
                    .putHeader("Content-Type", "application/json")
                    .end(JsonObject.mapFrom(updated).encode());
        } catch (Exception e) {
            logger.error("Error updating user", e);
            ctx.response().setStatusCode(500).end();
        }
    }

    public void deleteUser(RoutingContext ctx) {
        String id = ctx.pathParam("id");
        try {
            boolean deleted = userService.deleteUser(id);
            if (!deleted) {
                ctx.response().setStatusCode(404).end();
                return;
            }
            ctx.response().setStatusCode(204).end();
        } catch (Exception e) {
            logger.error("Error deleting user", e);
            ctx.response().setStatusCode(500).end();
        }
    }

    @Override
    public void addRoutes(Router router) {
        router.get("/users").handler(this::getAllUsers);
        router.get("/users/:id").handler(this::getUserById);
        router.post("/users").handler(this::createUser);
        router.put("/users/:id").handler(this::updateUser);
        router.delete("/users/:id").handler(this::deleteUser);
    }
}
