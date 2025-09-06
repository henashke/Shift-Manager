package com.shiftmanagerserver.dao;

import io.vertx.core.Future;

public interface AsyncIO<R, V> {
    Future<Void> write(V data);
    Future<R> read();
} 