package com.shiftmanagerserver.handlers;

import io.vertx.ext.web.Router;

public interface Handler {
    void addRoutes(Router router);
}

