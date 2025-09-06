package com.shiftmanagerserver.dao;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.inject.Inject;
import com.google.inject.name.Named;
import com.shiftmanagerserver.entities.Constraint;
import org.slf4j.LoggerFactory;

import java.util.ArrayList;
import java.util.List;

public class RedisConstraintDao extends AbstractRedisDao<List<Constraint>> {
    @Inject
    public RedisConstraintDao(ObjectMapper mapper, @Named("redis.key.prefix") String prefix) {
        super(mapper, prefix + ":constraints", LoggerFactory.getLogger(RedisConstraintDao.class));
    }

    @Override
    protected TypeReference<List<Constraint>> typeReference() {
        return new TypeReference<>() {};
    }

    @Override
    protected List<Constraint> empty() {
        return new ArrayList<>();
    }
}