package com.shiftmanagerserver.service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import io.vertx.core.json.JsonObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.crypto.SecretKey;
import java.util.Date;

public class JWTService {
    private static final Logger logger = LoggerFactory.getLogger(JWTService.class);
    private final SecretKey secretKey;
    private static final long EXPIRATION_TIME = 24 * 60 * 60 * 1000; // 24 hours

    public JWTService(String secret) {
        // Create a secret key from the provided secret
        this.secretKey = Keys.hmacShaKeyFor(secret.getBytes());
    }

    public String generateToken(String username, String role) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + EXPIRATION_TIME);

        return Jwts.builder()
                .setSubject(username)
                .claim("username", username)
                .claim("role", role)
                .setIssuedAt(now)
                .setExpiration(expiryDate)
                .signWith(secretKey, SignatureAlgorithm.HS256)
                .compact();
    }

    public Claims validateToken(String token) {
        try {
            return Jwts.parserBuilder()
                    .setSigningKey(secretKey)
                    .build()
                    .parseClaimsJws(token)
                    .getBody();
        } catch (Exception e) {
            logger.error("JWT validation failed", e);
            return null;
        }
    }

    public String getUsernameFromToken(String token) {
        Claims claims = validateToken(token);
        return claims != null ? claims.get("username", String.class) : null;
    }

    public String getRoleFromToken(String token) {
        Claims claims = validateToken(token);
        return claims != null ? claims.get("role", String.class) : null;
    }

    public boolean isTokenValid(String token) {
        return validateToken(token) != null;
    }
} 