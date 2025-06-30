package com.shiftmanagerserver.handlers;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.inject.Inject;
import com.shiftmanagerserver.entities.User;
import com.shiftmanagerserver.service.UserService;
import io.vertx.core.json.JsonObject;
import io.vertx.ext.web.Router;
import io.vertx.ext.web.RoutingContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class AuthHandler implements Handler {
    private static final Logger logger = LoggerFactory.getLogger(AuthHandler.class);
    private final UserService userService;
    private final ObjectMapper objectMapper;

    @Inject
    public AuthHandler(UserService userService, ObjectMapper objectMapper) {
        this.userService = userService;
        this.objectMapper = objectMapper;
    }

    public void handleSignup(RoutingContext ctx) {
        try {
            String body = ctx.body().asString();
            logger.info("Received signup request");

            User user = objectMapper.readValue(body, User.class);

            if (user.getName() == null || user.getName().trim().isEmpty() ||
                    user.getPassword() == null || user.getPassword().trim().isEmpty()) {
                ctx.response()
                        .setStatusCode(400)
                        .putHeader("Content-Type", "application/json")
                        .end(new JsonObject().put("error", "Username and password are required").encode());
                return;
            }

            userService.createUser(user)
                .onSuccess(created -> {
                    if (created) {
                        logger.info("User created successfully: {}", user.getName());
                        ctx.response()
                                .setStatusCode(201)
                                .putHeader("Content-Type", "application/json")
                                .end(new JsonObject().put("message", "User created successfully").encode());
                    } else {
                        logger.warn("Username already exists: {}", user.getName());
                        ctx.response()
                                .setStatusCode(409)
                                .putHeader("Content-Type", "application/json")
                                .end(new JsonObject().put("error", "Username already exists").encode());
                    }
                })
                .onFailure(err -> {
                    logger.error("Error creating user", err);
                    handleError(ctx, err);
                });
        } catch (Exception e) {
            logger.error("Error parsing signup data", e);
            handleError(ctx, e);
        }
    }

    public void handleLogin(RoutingContext ctx) {
        try {
            String body = ctx.body().asString();
            logger.info("Received login request");

            User credentials = objectMapper.readValue(body, User.class);

            if (credentials.getName() == null || credentials.getName().trim().isEmpty() ||
                    credentials.getPassword() == null || credentials.getPassword().trim().isEmpty()) {
                ctx.response()
                        .setStatusCode(400)
                        .putHeader("Content-Type", "application/json")
                        .end(new JsonObject().put("error", "Username and password are required").encode());
                return;
            }

            userService.authenticateUser(credentials.getName(), credentials.getPassword())
                .onSuccess(authenticated -> {
                    if (authenticated) {
                        logger.info("User authenticated successfully: {}", credentials.getName());
                        ctx.response()
                                .setStatusCode(200)
                                .putHeader("Content-Type", "application/json")
                                .end(new JsonObject()
                                        .put("message", "Login successful")
                                        .put("username", credentials.getName())
                                        .encode());
                    } else {
                        logger.warn("Authentication failed for user: {}", credentials.getName());
                        ctx.response()
                                .setStatusCode(401)
                                .putHeader("Content-Type", "application/json")
                                .end(new JsonObject().put("error", "Invalid username or password").encode());
                    }
                })
                .onFailure(err -> {
                    logger.error("Error during login", err);
                    handleError(ctx, err);
                });
        } catch (Exception e) {
            logger.error("Error parsing login data", e);
            handleError(ctx, e);
        }
    }

    private void handleError(RoutingContext ctx, Throwable e) {
        logger.error("Error processing request", e);
        ctx.response()
                .setStatusCode(500)
                .putHeader("content-type", "application/json")
                .end(new JsonObject().put("error", e.getMessage()).encode());
    }

    @Override
    public void addRoutes(Router router) {
        router.post("/auth/signup").handler(this::handleSignup);
        router.post("/auth/login").handler(this::handleLogin);
    }
}
