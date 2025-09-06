package com.shiftmanagerserver.dao;

import io.vertx.core.Vertx;
import io.vertx.core.net.NetClientOptions;
import io.vertx.redis.client.Redis;
import io.vertx.redis.client.RedisClientType;
import io.vertx.redis.client.RedisConnectOptions;
import io.vertx.redis.client.RedisOptions;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class RedisConfig {
    private static final Logger logger = LoggerFactory.getLogger(RedisConfig.class);
    private static Redis redisClient;

    public static Redis getRedisClient() {
        return redisClient;
    }

    public static void initialize(Vertx vertx, String redisUrl, String token) {
        try {
            logger.info("Initializing Redis with URL: {}", redisUrl);
            logger.info("Redis token provided: {}", token != null && !token.isEmpty() ? "YES" : "NO");
            
            // Parse Redis URL to extract host, port, and database
            RedisOptions redisOptions = parseRedisUrl(redisUrl);
            
            // Set password/token if provided
            if (token != null && !token.isEmpty()) {
                redisOptions.setPassword(token);
                logger.info("Redis password/token configured");
            }

            redisClient = Redis.createClient(vertx, redisOptions);
            
            // Test connection
            redisClient.connect()
                .onSuccess(conn -> {
                    logger.info("Successfully connected to Redis");
                    conn.close();
                })
                .onFailure(err -> {
                    logger.error("Failed to connect to Redis", err);
                });

        } catch (Exception e) {
            logger.error("Error initializing Redis client", e);
            throw new RuntimeException("Failed to initialize Redis", e);
        }
    }

    private static RedisOptions parseRedisUrl(String redisUrl) {
        logger.info("Parsing Redis URL: {}", redisUrl);
        
        // Handle different Redis URL formats
        // redis://host:port/db
        // redis://:password@host:port/db
        // rediss://host:port/db (SSL)
        
        boolean isSSL = redisUrl.startsWith("rediss://");
        
        // Force SSL for Upstash connections (they typically require SSL even with redis://)
        if (!isSSL && redisUrl.contains("upstash.io")) {
            isSSL = true;
            logger.info("Detected Upstash Redis connection, forcing SSL");
        }
        
        if (redisUrl.startsWith("redis://")) {
            redisUrl = redisUrl.substring(8);
        } else if (redisUrl.startsWith("rediss://")) {
            redisUrl = redisUrl.substring(9);
        }

        String[] parts = redisUrl.split("@");
        String hostPortDb;
        String password = null;

        if (parts.length == 2) {
            // Has password: redis://:password@host:port/db
            password = parts[0].substring(1); // Remove leading :
            hostPortDb = parts[1];
            logger.info("Found password in URL, hostPortDb: {}", hostPortDb);
        } else {
            // No password: redis://host:port/db
            hostPortDb = parts[0];
            logger.info("No password in URL, hostPortDb: {}", hostPortDb);
        }

        String[] hostPortParts = hostPortDb.split("/");
        String hostPort = hostPortParts[0];
        int database = 0;
        
        if (hostPortParts.length > 1) {
            try {
                database = Integer.parseInt(hostPortParts[1]);
            } catch (NumberFormatException e) {
                logger.warn("Invalid database number in Redis URL, using default database 0");
            }
        }

        String[] hostPortSplit = hostPort.split(":");
        String host = hostPortSplit[0];
        int port = 6379; // Default Redis port
        
        if (hostPortSplit.length > 1) {
            try {
                port = Integer.parseInt(hostPortSplit[1]);
            } catch (NumberFormatException e) {
                logger.warn("Invalid port in Redis URL, using default port 6379");
            }
        }

        logger.info("Parsed Redis connection - Host: {}, Port: {}, Database: {}, SSL: {}", host, port, database, isSSL);

        // Build the connection string with proper protocol
        String connectionString = (isSSL ? "rediss://" : "redis://") + host + ":" + port;
        logger.info("Using connection string: {}", connectionString);

        RedisOptions redisOptions = new RedisOptions()
            .setType(RedisClientType.STANDALONE)
            .setMaxPoolSize(8)
            .setMaxWaitingHandlers(32)
            .setNetClientOptions(
                new NetClientOptions()
                    .setConnectTimeout(10000) // Increased timeout for cloud connections
                    .setTcpKeepAlive(true)
                    .setSsl(isSSL) // Enable SSL if needed
            );

        // Only set hostname verification for SSL connections
        if (isSSL) {
            redisOptions.getNetClientOptions().setHostnameVerificationAlgorithm("HTTPS");
        }

        // Set the connection string
        redisOptions.addConnectionString(connectionString);

        if (password != null) {
            redisOptions.setPassword(password);
            logger.info("Password set from URL");
        }

        return redisOptions;
    }

    public static void close() {
        if (redisClient != null) {
            redisClient.close();
            logger.info("Redis client closed");
        }
    }
} 