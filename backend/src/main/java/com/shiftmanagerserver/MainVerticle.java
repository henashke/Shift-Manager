package com.shiftmanagerserver;

import com.google.inject.Inject;
import com.google.inject.name.Named;
import com.shiftmanagerserver.dao.RedisConfig;
import com.shiftmanagerserver.handlers.*;
import io.vertx.core.AbstractVerticle;
import io.vertx.core.Promise;
import io.vertx.ext.web.Router;
import io.vertx.ext.web.handler.StaticHandler;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import com.shiftmanagerserver.service.JWTService;
import com.shiftmanagerserver.handlers.JWTAuthHandler;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.shiftmanagerserver.service.ConstraintService;
import com.shiftmanagerserver.service.ShiftService;
import com.shiftmanagerserver.service.ShiftWeightSettingsService;
import com.shiftmanagerserver.service.UserService;

public class MainVerticle extends AbstractVerticle {
    private final Logger logger;
    private final Integer port;
    private final String redisUrl;
    private final String redisToken;
    private final Router router;
    private final UserService userService;
    private final ConstraintService constraintService;
    private final ShiftService shiftService;
    private final ShiftWeightSettingsService shiftWeightSettingsService;
    private final ObjectMapper objectMapper;
    private JWTService jwtService;

    @Inject
    public MainVerticle(
            @Named("application.port") Integer port,
            @Named("redis.url") String redisUrl,
            @Named("redis.token") String redisToken,
            Router router,
            UserService userService,
            ConstraintService constraintService,
            ShiftService shiftService,
            ShiftWeightSettingsService shiftWeightSettingsService,
            ObjectMapper objectMapper
    ) {
        this.port = port;
        this.redisUrl = redisUrl;
        this.redisToken = redisToken;
        this.router = router;
        this.userService = userService;
        this.constraintService = constraintService;
        this.shiftService = shiftService;
        this.shiftWeightSettingsService = shiftWeightSettingsService;
        this.objectMapper = objectMapper;
        this.logger = LoggerFactory.getLogger(MainVerticle.class);
    }

    @Override
    public void start(Promise<Void> startPromise) {
        logger.info("Starting Shift-Manager application...");

        // Initialize Redis
        try {
            RedisConfig.initialize(vertx, redisUrl, redisToken);
            logger.info("Redis initialized with URL: {}", redisUrl);
        } catch (Exception e) {
            logger.error("Failed to initialize Redis", e);
            startPromise.fail(e);
            return;
        }

        userService.ensureAdminUser();

        // JWT setup using custom service
        String jwtSecret = System.getenv().getOrDefault("JWT_SECRET", "supersecretkeysupersecretkey123456supersecretkeysupersecretkey123456");
        jwtService = new JWTService(jwtSecret);
        logger.info("JWT authentication enabled with custom service");


        // Manually construct handlers
        AuthHandler authHandler = new AuthHandler(userService, objectMapper, jwtService);
        UserHandler userHandler = new UserHandler(userService, objectMapper);
        ConstraintHandler constraintHandler = new ConstraintHandler(constraintService, objectMapper);
        ShiftHandler shiftHandler = new ShiftHandler(shiftService, userService, constraintService, shiftWeightSettingsService, objectMapper);
        ShiftWeightSettingsHandler shiftWeightSettingsHandler = new ShiftWeightSettingsHandler(shiftWeightSettingsService, objectMapper);

        bindRoutes(router, authHandler, userHandler, constraintHandler, shiftHandler, shiftWeightSettingsHandler);

        vertx.createHttpServer()
                .requestHandler(router)
                .listen(port, http -> {
                    if (http.succeeded()) {
                        startPromise.complete();
                        logger.info("HTTP server started on port " + port);
                    } else {
                        logger.error("Failed to start HTTP server", http.cause());
                        startPromise.fail(http.cause());
                    }
                });
    }

    @Override
    public void stop(Promise<Void> stopPromise) {
        RedisConfig.close();
        stopPromise.complete();
    }

    private void bindRoutes(Router router,
                            AuthHandler authHandler, UserHandler userHandler, ConstraintHandler constraintHandler,
                            ShiftHandler shiftHandler, ShiftWeightSettingsHandler shiftWeightSettingsHandler) {


        // API routes first
        authHandler.addRoutes(router); // login/signup are public
        
        // Protect all API routes except auth using custom JWT handler
        JWTAuthHandler jwtAuthHandler = new JWTAuthHandler(jwtService);
        router.route("/api/users*").handler(jwtAuthHandler);
        router.route("/api/constraints*").handler(jwtAuthHandler);
        router.route("/api/shifts*").handler(jwtAuthHandler);
        router.route("/api/shift-weight-settings*").handler(jwtAuthHandler);
        
        userHandler.addRoutes(router);
        constraintHandler.addRoutes(router);
        shiftHandler.addRoutes(router);
        shiftWeightSettingsHandler.addRoutes(router);

        router.route("/*").handler(StaticHandler.create());

        router.route().handler(ctx -> {
            ctx.response().sendFile("index.html");
        });
    }
}
