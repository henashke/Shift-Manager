package com.shiftmanagerserver.dao;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.inject.Inject;
import com.google.inject.name.Named;
import com.shiftmanagerserver.entities.Constraint;
import io.vertx.core.Future;
import io.vertx.core.Promise;
import io.vertx.redis.client.Redis;
import io.vertx.redis.client.RedisAPI;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.ArrayList;
import java.util.List;

public class RedisConstraintDao implements AsyncIO<List<Constraint>, List<Constraint>> {
    private final ObjectMapper mapper;
    private final String keyPrefix;
    private final Logger logger = LoggerFactory.getLogger(RedisConstraintDao.class);

    @Inject
    public RedisConstraintDao(ObjectMapper mapper,
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
    public Future<Void> write(List<Constraint> data) {
        Promise<Void> promise = Promise.promise();
        
        try {
            String jsonData = mapper.writeValueAsString(data);
            String key = keyPrefix + ":constraints";
            
            logger.info("Writing {} constraints to Redis with key: {}", data.size(), key);
            logger.debug("JSON data: {}", jsonData);
            
            Redis redisClient = getRedisClient();
            redisClient.connect()
                .onSuccess(conn -> {
                    logger.info("Connected to Redis, sending SET command");
                    RedisAPI redis = RedisAPI.api(conn);
                    redis.set(List.of(key, jsonData))
                        .onSuccess(response -> {
                            logger.info("Successfully saved {} constraints to Redis. Response: {}", data.size(), response);
                            conn.close();
                            promise.complete();
                        })
                        .onFailure(err -> {
                            logger.error("Error saving constraints to Redis", err);
                            conn.close();
                            promise.fail(err);
                        });
                })
                .onFailure(err -> {
                    logger.error("Error connecting to Redis", err);
                    promise.fail(err);
                });
                
        } catch (Exception e) {
            logger.error("Error serializing constraints to JSON", e);
            promise.fail(e);
        }
        
        return promise.future();
    }

    @Override
    public Future<List<Constraint>> read() {
        Promise<List<Constraint>> promise = Promise.promise();
        String key = keyPrefix + ":constraints";
        
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
                                    List<Constraint> constraints = mapper.readValue(jsonData, new TypeReference<>() {});
                                    logger.info("Loaded {} constraints from Redis", constraints.size());
                                    promise.complete(constraints);
                                } catch (Exception e) {
                                    logger.error("Error deserializing constraints from JSON", e);
                                    promise.complete(new ArrayList<>());
                                }
                            } else {
                                logger.info("No existing constraints found in Redis, starting with empty list");
                                promise.complete(new ArrayList<>());
                            }
                        })
                        .onFailure(err -> {
                            logger.error("Error loading constraints from Redis", err);
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