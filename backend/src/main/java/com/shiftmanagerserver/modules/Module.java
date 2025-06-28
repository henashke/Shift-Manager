package com.shiftmanagerserver.modules;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.inject.AbstractModule;
import com.google.inject.Provides;
import com.google.inject.name.Names;
import io.vertx.core.Vertx;
import io.vertx.core.http.HttpMethod;
import io.vertx.ext.web.Router;
import io.vertx.ext.web.handler.BodyHandler;
import io.vertx.ext.web.handler.CorsHandler;

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
                .allowedHeader("Content-Type"));
        router.route().handler(BodyHandler.create());
        return router;
    }

    @Provides
    public ObjectMapper mapper() {
        return new ObjectMapper();
    }

    @Override
    protected void configure() {
        bindConstant().annotatedWith(Names.named("api.basic-assignment.url")).to(System.getenv().getOrDefault("solver.url", "/findAssignment/basic"));
        bindConstant().annotatedWith(Names.named("solver.ip")).to(System.getenv().getOrDefault("solver.ip", "localhost"));
        bindConstant().annotatedWith(Names.named("solver.port")).to(Integer.parseInt(System.getenv().getOrDefault("solver.port", "8081")));
        bindConstant().annotatedWith(Names.named("application.port")).to(Integer.parseInt(System.getenv().getOrDefault("application.port", "8080")));
        bindConstant().annotatedWith(Names.named("database.file")).to(System.getenv().getOrDefault("database.file", "/resources/db.json"));
    }
}
