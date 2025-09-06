package com.shiftmanagerserver.converters;

public interface Converter<T, R> {

    R convert(T object);
}
