package com.shiftmanagerserver.dao;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.inject.Inject;
import com.google.inject.name.Named;
import com.shiftmanagerserver.entities.ShiftWeightSettings;
import org.slf4j.LoggerFactory;

public class RedisShiftWeightSettingsDao extends AbstractRedisDao<ShiftWeightSettings> {

    @Inject
    public RedisShiftWeightSettingsDao(ObjectMapper mapper,
                                       @Named("redis.key.prefix") String prefix) {
        super(mapper, prefix + ":shift_weight_settings", LoggerFactory.getLogger(RedisShiftWeightSettingsDao.class));
    }

    @Override
    protected TypeReference<ShiftWeightSettings> typeReference() {
        return new TypeReference<>() {};
    }

    @Override
    protected ShiftWeightSettings empty() {
        return new ShiftWeightSettings(); // or a default-initialized version
    }
}
