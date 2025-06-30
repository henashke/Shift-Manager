package com.shiftmanagerserver.dao;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.inject.Inject;
import com.google.inject.name.Named;
import com.shiftmanagerserver.entities.User;
import io.vertx.core.Future;
import io.vertx.core.Promise;
import io.vertx.redis.client.Redis;
import io.vertx.redis.client.RedisAPI;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

public class RedisUserDao implements AsyncIO<Set<User>, Set<User>> {
    private final ObjectMapper mapper;
    private final String keyPrefix;
    private final Logger logger = LoggerFactory.getLogger(RedisUserDao.class);

    @Inject
    public RedisUserDao(ObjectMapper mapper,
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
    public Future<Void> write(Set<User> data) {
        Promise<Void> promise = Promise.promise();
        
        try {
            String jsonData = mapper.writeValueAsString(data);
            String key = keyPrefix + ":users";
            
            logger.info("Writing {} users to Redis with key: {}", data.size(), key);
            logger.debug("JSON data: {}", jsonData);
            
            Redis redisClient = getRedisClient();
            redisClient.connect()
                .onSuccess(conn -> {
                    logger.info("Connected to Redis, sending SET command");
                    RedisAPI redis = RedisAPI.api(conn);
                    redis.set(List.of(key, jsonData))
                        .onSuccess(response -> {
                            logger.info("Successfully saved {} users to Redis. Response: {}", data.size(), response);
                            conn.close();
                            promise.complete();
                        })
                        .onFailure(err -> {
                            logger.error("Error saving users to Redis", err);
                            conn.close();
                            promise.fail(err);
                        });
                })
                .onFailure(err -> {
                    logger.error("Error connecting to Redis", err);
                    promise.fail(err);
                });
                
        } catch (Exception e) {
            logger.error("Error serializing users to JSON", e);
            promise.fail(e);
        }
        
        return promise.future();
    }

    @Override
    public Future<Set<User>> read() {
        Promise<Set<User>> promise = Promise.promise();
        String key = keyPrefix + ":users";
        
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
                                    Set<User> users = mapper.readValue(jsonData, new TypeReference<>() {});
                                    logger.info("Loaded {} users from Redis", users.size());
                                    promise.complete(users);
                                } catch (Exception e) {
                                    logger.error("Error deserializing users from JSON", e);
                                    promise.complete(new HashSet<>());
                                }
                            } else {
                                logger.info("No existing users found in Redis, starting with empty list");
                                promise.complete(new HashSet<>());
                            }
                        })
                        .onFailure(err -> {
                            logger.error("Error loading users from Redis", err);
                            conn.close();
                            promise.complete(new HashSet<>());
                        });
                })
                .onFailure(err -> {
                    logger.error("Error connecting to Redis", err);
                    promise.complete(new HashSet<>());
                });
        } catch (IllegalStateException e) {
            logger.warn("Redis not initialized yet, returning empty set: {}", e.getMessage());
            promise.complete(new HashSet<>());
        }
        
        return promise.future();
    }
} 