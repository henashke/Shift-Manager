package com.shiftmanagerserver.modules;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.inject.AbstractModule;
import com.google.inject.Provides;
import com.google.inject.TypeLiteral;
import com.google.inject.name.Names;
import com.shiftmanagerserver.dao.AsyncIO;
import com.shiftmanagerserver.dao.RedisUserDao;
import com.shiftmanagerserver.dao.RedisShiftsDao;
import com.shiftmanagerserver.dao.RedisConstraintDao;
import com.shiftmanagerserver.dao.RedisShiftWeightSettingsDao;
import com.shiftmanagerserver.entities.User;
import com.shiftmanagerserver.entities.AssignedShift;
import com.shiftmanagerserver.entities.Constraint;
import com.shiftmanagerserver.entities.ShiftWeightSettings;
import com.shiftmanagerserver.handlers.AuthHandler;
import com.shiftmanagerserver.handlers.ConstraintHandler;
import com.shiftmanagerserver.handlers.ShiftHandler;
import com.shiftmanagerserver.handlers.ShiftWeightSettingsHandler;
import com.shiftmanagerserver.handlers.UserHandler;
import com.shiftmanagerserver.service.ConstraintService;
import com.shiftmanagerserver.service.ShiftService;
import com.shiftmanagerserver.service.ShiftWeightSettingsService;
import com.shiftmanagerserver.service.UserService;
import io.vertx.core.Vertx;
import io.vertx.core.http.HttpMethod;
import io.vertx.ext.web.Router;
import io.vertx.ext.web.handler.BodyHandler;
import io.vertx.ext.web.handler.CorsHandler;
import io.vertx.ext.auth.jwt.JWTAuth;
import io.vertx.ext.auth.jwt.JWTAuthOptions;
import io.vertx.ext.auth.PubSecKeyOptions;

import java.util.Set;
import java.util.List;

public class Module extends AbstractModule {
    @Provides
    public Vertx provideVertx() {
        return Vertx.vertx();
    }

    @Provides
    public Router provideVertx(Vertx vertx) {
        Router router = Router.router(vertx);
        router.route().handler(CorsHandler.create()
                .allowedMethod(HttpMethod.GET)
                .allowedMethod(HttpMethod.POST)
                .allowedMethod(HttpMethod.PUT)
                .allowedMethod(HttpMethod.DELETE)
                .allowedHeader("Content-Type")
                .allowedHeader("Authorization"));
        router.route().handler(BodyHandler.create());
        return router;
    }

    @Provides
    public ObjectMapper mapper() {
        ObjectMapper mapper = new ObjectMapper();
        mapper.configure(com.fasterxml.jackson.databind.DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
        return mapper;
    }

    @Override
    protected void configure() {
        bindConstant().annotatedWith(Names.named("api.basic-assignment.url")).to(System.getenv().getOrDefault("solver.url", "/findAssignment/basic"));
        bindConstant().annotatedWith(Names.named("solver.ip")).to(System.getenv().getOrDefault("solver.ip", "localhost"));
        bindConstant().annotatedWith(Names.named("solver.port")).to(Integer.parseInt(System.getenv().getOrDefault("solver.port", "8081")));
        bindConstant().annotatedWith(Names.named("application.port")).to(Integer.parseInt(System.getenv().getOrDefault("application.port", "8080")));
        bindConstant().annotatedWith(Names.named("database.file")).to(System.getenv().getOrDefault("database.file", "/resources/db.json"));
        
        // Redis configuration
        String redisUrl = System.getenv().getOrDefault("REDIS_URL", "redis://default:@gusc1-moving-tetra-32048.upstash.io:32048");
        String redisToken = System.getenv().getOrDefault("REDIS_TOKEN", "AX0wASQgNDBhMTQ1ZGUtMGQxMy00ZTY3LTkyYWItZTI4NThjYzMxOWNiNDkyZWE1YTM3YjM5NDc0MzkyNzQzMTk3ZjU1NWEzNmM=");
        String redisKeyPrefix = System.getenv().getOrDefault("REDIS_KEY_PREFIX", "shiftmanager");
        
        System.out.println("=== Redis Configuration Debug ===");
        System.out.println("REDIS_URL: " + redisUrl);
        System.out.println("REDIS_TOKEN: " + (redisToken.isEmpty() ? "NOT_SET" : "SET"));
        System.out.println("REDIS_KEY_PREFIX: " + redisKeyPrefix);
        System.out.println("=================================");
        
        bindConstant().annotatedWith(Names.named("redis.url")).to(redisUrl);
        bindConstant().annotatedWith(Names.named("redis.token")).to(redisToken);
        bindConstant().annotatedWith(Names.named("redis.key.prefix")).to(redisKeyPrefix);
        
        // Bind Redis DAO as the primary implementation for AsyncIO
        bind(new TypeLiteral<AsyncIO<Set<User>, Set<User>>>() {})
                .annotatedWith(Names.named("user.dao"))
                .to(RedisUserDao.class);
        
        // Bind Redis DAOs for other entities
        bind(new TypeLiteral<AsyncIO<List<AssignedShift>, List<AssignedShift>>>() {})
            .annotatedWith(Names.named("shift.dao"))
            .to(RedisShiftsDao.class);
            
        bind(new TypeLiteral<AsyncIO<List<Constraint>, List<Constraint>>>() {})
            .annotatedWith(Names.named("constraint.dao"))
            .to(RedisConstraintDao.class);
            
        bind(new TypeLiteral<AsyncIO<ShiftWeightSettings, ShiftWeightSettings>>() {})
            .annotatedWith(Names.named("shift.weight.settings.dao"))
            .to(RedisShiftWeightSettingsDao.class);
        
        // Bind services
        bind(UserService.class);
        bind(ConstraintService.class);
        bind(ShiftService.class);
        bind(ShiftWeightSettingsService.class);
        
        // Bind handlers
    }
}
