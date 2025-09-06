package com.shiftmanagerserver.dao;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.vertx.core.Future;
import io.vertx.core.Promise;
import io.vertx.redis.client.Redis;
import io.vertx.redis.client.RedisAPI;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;

public abstract class AbstractRedisDao<T> implements AsyncIO<T, T> {
    protected final ObjectMapper mapper;
    protected final String key;
    protected Logger logger = LoggerFactory.getLogger(AbstractRedisDao.class);

    protected AbstractRedisDao(ObjectMapper mapper, String key, Logger logger) {
        this.mapper = mapper;
        this.key = key;
        this.logger = logger;
    }

    protected Redis getRedisClient() {
        Redis client = RedisConfig.getRedisClient();
        if (client == null) {
            throw new IllegalStateException("Redis client not initialized.");
        }
        return client;
    }

    protected abstract TypeReference<T> typeReference();

    @Override
    public Future<Void> write(T data) {
        Promise<Void> promise = Promise.promise();
        try {
            String json = mapper.writeValueAsString(data);
            Redis redisClient = getRedisClient();
            redisClient.connect()
                    .onSuccess(conn -> {
                        RedisAPI redis = RedisAPI.api(conn);
                        redis.set(List.of(key, json))
                                .onSuccess(res -> {
                                    logger.info("Saved data to Redis with key: {}", key);
                                    conn.close();
                                    promise.complete();
                                })
                                .onFailure(err -> {
                                    logger.error("Redis write failed", err);
                                    conn.close();
                                    promise.fail(err);
                                });
                    })
                    .onFailure(err -> {
                        logger.error("Redis connection failed", err);
                        promise.fail(err);
                    });
        } catch (Exception e) {
            logger.error("Serialization failed", e);
            promise.fail(e);
        }
        return promise.future();
    }

    @Override
    public Future<T> read() {
        Promise<T> promise = Promise.promise();
        try {
            Redis redisClient = getRedisClient();
            redisClient.connect()
                    .onSuccess(conn -> {
                        RedisAPI redis = RedisAPI.api(conn);
                        redis.get(key)
                                .onSuccess(res -> {
                                    conn.close();
                                    if (res != null && res.toString() != null) {
                                        try {
                                            T result = mapper.readValue(res.toString(), typeReference());
                                            promise.complete(result);
                                        } catch (Exception e) {
                                            logger.error("Deserialization failed", e);
                                            promise.complete(empty());
                                        }
                                    } else {
                                        promise.complete(empty());
                                    }
                                })
                                .onFailure(err -> {
                                    logger.error("Redis read failed", err);
                                    conn.close();
                                    promise.complete(empty());
                                });
                    })
                    .onFailure(err -> {
                        logger.error("Redis connection failed", err);
                        promise.complete(empty());
                    });
        } catch (IllegalStateException e) {
            logger.warn("Redis not initialized", e);
            promise.complete(empty());
        }
        return promise.future();
    }

    // To be implemented by concrete DAO to define fallback (like empty list/set)
    protected abstract T empty();
}