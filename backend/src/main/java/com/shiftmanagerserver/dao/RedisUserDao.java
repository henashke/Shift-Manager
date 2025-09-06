package com.shiftmanagerserver.dao;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.inject.Inject;
import com.google.inject.name.Named;
import com.shiftmanagerserver.entities.User;
import org.slf4j.LoggerFactory;

import java.util.HashSet;
import java.util.Set;

public class RedisUserDao extends AbstractRedisDao<Set<User>> {
    @Inject
    public RedisUserDao(ObjectMapper mapper, @Named("redis.key.prefix") String prefix) {
        super(mapper, prefix + ":users", LoggerFactory.getLogger(RedisUserDao.class));
    }

    @Override
    protected TypeReference<Set<User>> typeReference() {
        return new TypeReference<>() {};
    }

    @Override
    protected Set<User> empty() {
        return new HashSet<>();
    }
}