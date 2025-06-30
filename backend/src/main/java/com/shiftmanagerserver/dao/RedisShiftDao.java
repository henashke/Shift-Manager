package com.shiftmanagerserver.dao;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.inject.Inject;
import com.google.inject.name.Named;
import com.shiftmanagerserver.entities.AssignedShift;
import io.vertx.core.Future;
import io.vertx.core.Promise;
import io.vertx.redis.client.Redis;
import io.vertx.redis.client.RedisAPI;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.ArrayList;
import java.util.List;

public class RedisShiftDao implements AsyncIO<List<AssignedShift>, List<AssignedShift>> {
    private final ObjectMapper mapper;
    private final String keyPrefix;
    private final Logger logger = LoggerFactory.getLogger(RedisShiftDao.class);

    @Inject
    public RedisShiftDao(ObjectMapper mapper,
                        @Named("redis.key.prefix") String keyPrefix) {
        this.mapper = mapper;
        this.keyPrefix = keyPrefix;
    }

    private Redis getRedisClient() {
        Redis client = RedisConfig.getRedisClient();
        if (client == null) {
            throw new IllegalStateException("Redis client not initialized. Make sure Redis is configured and the application has started.");
        }
        return client;
    }

    @Override
    public Future<Void> write(List<AssignedShift> data) {
        Promise<Void> promise = Promise.promise();
        
        try {
            String jsonData = mapper.writeValueAsString(data);
            String key = keyPrefix + ":shifts";
            
            logger.info("Writing {} shifts to Redis with key: {}", data.size(), key);
            logger.debug("JSON data: {}", jsonData);
            
            Redis redisClient = getRedisClient();
            redisClient.connect()
                .onSuccess(conn -> {
                    logger.info("Connected to Redis, sending SET command");
                    RedisAPI redis = RedisAPI.api(conn);
                    redis.set(List.of(key, jsonData))
                        .onSuccess(response -> {
                            logger.info("Successfully saved {} shifts to Redis. Response: {}", data.size(), response);
                            conn.close();
                            promise.complete();
                        })
                        .onFailure(err -> {
                            logger.error("Error saving shifts to Redis", err);
                            conn.close();
                            promise.fail(err);
                        });
                })
                .onFailure(err -> {
                    logger.error("Error connecting to Redis", err);
                    promise.fail(err);
                });
                
        } catch (Exception e) {
            logger.error("Error serializing shifts to JSON", e);
            promise.fail(e);
        }
        
        return promise.future();
    }

    @Override
    public Future<List<AssignedShift>> read() {
        Promise<List<AssignedShift>> promise = Promise.promise();
        String key = keyPrefix + ":shifts";
        
        try {
            Redis redisClient = getRedisClient();
            redisClient.connect()
                .onSuccess(conn -> {
                    RedisAPI redis = RedisAPI.api(conn);
                    redis.get(key)
                        .onSuccess(response -> {
                            conn.close();
                            if (response != null && response.toString() != null) {
                                try {
                                    String jsonData = response.toString();
                                    List<AssignedShift> shifts = mapper.readValue(jsonData, new TypeReference<>() {});
                                    logger.info("Loaded {} shifts from Redis", shifts.size());
                                    promise.complete(shifts);
                                } catch (Exception e) {
                                    logger.error("Error deserializing shifts from JSON", e);
                                    promise.complete(new ArrayList<>());
                                }
                            } else {
                                logger.info("No existing shifts found in Redis, starting with empty list");
                                promise.complete(new ArrayList<>());
                            }
                        })
                        .onFailure(err -> {
                            logger.error("Error loading shifts from Redis", err);
                            conn.close();
                            promise.complete(new ArrayList<>());
                        });
                })
                .onFailure(err -> {
                    logger.error("Error connecting to Redis", err);
                    promise.complete(new ArrayList<>());
                });
        } catch (IllegalStateException e) {
            logger.warn("Redis not initialized yet, returning empty list: {}", e.getMessage());
            promise.complete(new ArrayList<>());
        }
        
        return promise.future();
    }
} 