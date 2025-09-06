package com.shiftmanagerserver;

import com.google.inject.Guice;
import com.google.inject.Injector;
import com.shiftmanagerserver.modules.Module;
import io.vertx.core.Vertx;

public class Main {

    static Injector injector = Guice.createInjector(new Module());
    static MainVerticle mainVerticle = injector.getInstance(MainVerticle.class);
    public static void main(String[] args) {
        Vertx vertx = Vertx.vertx();
        vertx.deployVerticle(mainVerticle, ar -> {
            if (ar.succeeded()) {
                System.out.println("Verticle deployed successfully");
            } else {
                System.out.println("Failed to deploy verticle: " + ar.cause().getMessage());
            }
        });
    }
} 