package com.shiftmanagerserver.dao;

public interface IO<R, V> {
    void write(V data);

    R read();
}
