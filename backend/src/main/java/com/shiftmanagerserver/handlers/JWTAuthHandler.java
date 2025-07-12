package com.shiftmanagerserver.handlers;

import com.shiftmanagerserver.service.JWTService;
import io.vertx.core.Handler;
import io.vertx.core.json.JsonObject;
import io.vertx.ext.auth.User;
import io.vertx.ext.auth.impl.UserImpl;
import io.vertx.ext.web.RoutingContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class JWTAuthHandler implements Handler<RoutingContext> {
    private static final Logger logger = LoggerFactory.getLogger(JWTAuthHandler.class);
    private final JWTService jwtService;

    public JWTAuthHandler(JWTService jwtService) {
        this.jwtService = jwtService;
    }

    @Override
    public void handle(RoutingContext ctx) {
        String authHeader = ctx.request().getHeader("Authorization");
        
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            ctx.response()
                .setStatusCode(401)
                .putHeader("Content-Type", "application/json")
                .end(new JsonObject().put("error", "Missing or invalid Authorization header").encode());
            return;
        }

        String token = authHeader.substring(7); // Remove "Bearer " prefix
        
        if (!jwtService.isTokenValid(token)) {
            ctx.response()
                .setStatusCode(401)
                .putHeader("Content-Type", "application/json")
                .end(new JsonObject().put("error", "Invalid or expired token").encode());
            return;
        }

        // Extract user information from token
        String username = jwtService.getUsernameFromToken(token);
        String role = jwtService.getRoleFromToken(token);
        
        if (username == null || role == null) {
            ctx.response()
                .setStatusCode(401)
                .putHeader("Content-Type", "application/json")
                .end(new JsonObject().put("error", "Invalid token claims").encode());
            return;
        }

        JsonObject principal = new JsonObject()
            .put("username", username)
            .put("role", role);
        
        User user = User.create(principal);
        ctx.setUser(user);

        ctx.next();
    }
} 