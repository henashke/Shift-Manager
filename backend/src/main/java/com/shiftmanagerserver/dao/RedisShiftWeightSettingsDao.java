package com.shiftmanagerserver.dao;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.inject.Inject;
import com.google.inject.name.Named;
import com.shiftmanagerserver.entities.ShiftWeightSettings;
import io.vertx.core.Future;
import io.vertx.core.Promise;
import io.vertx.redis.client.Redis;
import io.vertx.redis.client.RedisAPI;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;

public class RedisShiftWeightSettingsDao implements AsyncIO<ShiftWeightSettings, ShiftWeightSettings> {
    private final ObjectMapper mapper;
    private final String keyPrefix;
    private final Logger logger = LoggerFactory.getLogger(RedisShiftWeightSettingsDao.class);

    @Inject
    public RedisShiftWeightSettingsDao(ObjectMapper mapper,
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
    public Future<Void> write(ShiftWeightSettings data) {
        Promise<Void> promise = Promise.promise();
        
        try {
            String jsonData = mapper.writeValueAsString(data);
            String key = keyPrefix + ":shift_weight_settings";
            
            logger.info("Writing shift weight settings to Redis with key: {}", key);
            logger.debug("JSON data: {}", jsonData);
            
            Redis redisClient = getRedisClient();
            redisClient.connect()
                .onSuccess(conn -> {
                    logger.info("Connected to Redis, sending SET command");
                    RedisAPI redis = RedisAPI.api(conn);
                    redis.set(List.of(key, jsonData))
                        .onSuccess(response -> {
                            logger.info("Successfully saved shift weight settings to Redis. Response: {}", response);
                            conn.close();
                            promise.complete();
                        })
                        .onFailure(err -> {
                            logger.error("Error saving shift weight settings to Redis", err);
                            conn.close();
                            promise.fail(err);
                        });
                })
                .onFailure(err -> {
                    logger.error("Error connecting to Redis", err);
                    promise.fail(err);
                });
                
        } catch (Exception e) {
            logger.error("Error serializing shift weight settings to JSON", e);
            promise.fail(e);
        }
        
        return promise.future();
    }

    @Override
    public Future<ShiftWeightSettings> read() {
        Promise<ShiftWeightSettings> promise = Promise.promise();
        String key = keyPrefix + ":shift_weight_settings";
        
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
                                    ShiftWeightSettings settings = mapper.readValue(jsonData, ShiftWeightSettings.class);
                                    logger.info("Loaded shift weight settings from Redis");
                                    promise.complete(settings);
                                } catch (Exception e) {
                                    logger.error("Error deserializing shift weight settings from JSON", e);
                                    promise.complete(new ShiftWeightSettings());
                                }
                            } else {
                                logger.info("No existing shift weight settings found in Redis, starting with default");
                                promise.complete(new ShiftWeightSettings());
                            }
                        })
                        .onFailure(err -> {
                            logger.error("Error loading shift weight settings from Redis", err);
                            conn.close();
                            promise.complete(new ShiftWeightSettings());
                        });
                })
                .onFailure(err -> {
                    logger.error("Error connecting to Redis", err);
                    promise.complete(new ShiftWeightSettings());
                });
        } catch (IllegalStateException e) {
            logger.warn("Redis not initialized yet, returning default settings: {}", e.getMessage());
            promise.complete(new ShiftWeightSettings());
        }
        
        return promise.future();
    }
} 