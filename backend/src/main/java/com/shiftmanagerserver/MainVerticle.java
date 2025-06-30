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

public class MainVerticle extends AbstractVerticle {
    private final Logger logger;
    private final Integer port;
    private final UserHandler userHandler;
    private final Router router;
    private final ConstraintHandler constraintHandler;
    private final AuthHandler authHandler;
    private final ShiftHandler shiftHandler;
    private final ShiftWeightSettingsHandler shiftWeightSettingsHandler;
    private final String redisUrl;
    private final String redisToken;

    @Inject
    public MainVerticle(@Named("application.port") Integer port, 
                       @Named("redis.url") String redisUrl,
                       @Named("redis.token") String redisToken,
                       Router router,
                       UserHandler userHandler, AuthHandler authHandler, ConstraintHandler constraintHandler, ShiftHandler shiftHandler, ShiftWeightSettingsHandler shiftWeightSettingsHandler) {
        this.port = port;
        this.redisUrl = redisUrl;
        this.redisToken = redisToken;
        this.userHandler = userHandler;
        this.authHandler = authHandler;
        this.constraintHandler = constraintHandler;
        this.shiftHandler = shiftHandler;
        this.shiftWeightSettingsHandler = shiftWeightSettingsHandler;
        this.router = router;
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
        
        bindRoutes(router);
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

    private void bindRoutes(Router router) {
        router.route("/*").handler(StaticHandler.create("static"));
        authHandler.addRoutes(router);
        userHandler.addRoutes(router);
        constraintHandler.addRoutes(router);
        shiftHandler.addRoutes(router);
        shiftWeightSettingsHandler.addRoutes(router);
    }

}
