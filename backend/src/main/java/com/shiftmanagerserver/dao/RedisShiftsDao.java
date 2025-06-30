package com.shiftmanagerserver.dao;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.inject.Inject;
import com.google.inject.name.Named;
import com.shiftmanagerserver.entities.AssignedShift;
import org.slf4j.LoggerFactory;

import java.util.ArrayList;
import java.util.List;

public class RedisShiftsDao extends AbstractRedisDao<List<AssignedShift>> {

    @Inject
    public RedisShiftsDao(ObjectMapper mapper, @Named("redis.key.prefix") String prefix) {
        super(mapper, prefix + ":shifts", LoggerFactory.getLogger(RedisShiftsDao.class));
    }

    @Override
    protected TypeReference<List<AssignedShift>> typeReference() {
        return new TypeReference<>() {};
    }

    @Override
    protected List<AssignedShift> empty() {
        return new ArrayList<>();
    }
}
