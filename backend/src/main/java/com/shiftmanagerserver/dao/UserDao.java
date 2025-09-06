package com.shiftmanagerserver.dao;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.inject.Inject;
import com.google.inject.name.Named;
import com.shiftmanagerserver.entities.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.File;
import java.io.IOException;
import java.util.HashSet;
import java.util.Set;

public class UserDao implements IO<Set<User>, Set<User>> {
    private final ObjectMapper mapper;
    private final String dataFile;
    private final Logger logger = LoggerFactory.getLogger(UserDao.class);

    @Inject
    public UserDao(ObjectMapper mapper,
                   @Named("data.file") String dataFile) {
        this.mapper = mapper;
        this.dataFile = dataFile;
    }

    @Override
    public void write(Set<User> data) {
        try {
            mapper.writeValue(new File(dataFile), data);
            logger.debug("Saved {} users to file", data.size());
        } catch (IOException e) {
            logger.error("Error saving users to file", e);
        }
    }

    @Override
    public Set<User> read() {
        Set<User> users = new HashSet<>();
        try {
            File file = new File(dataFile);
            if (file.exists()) {
                users = mapper.readValue(file, new TypeReference<>() {
                });
                logger.info("Loaded {} users from file", users.size());
            } else {
                logger.info("No existing users file found, starting with empty list");
            }
        } catch (IOException e) {
            logger.error("Error loading users from file", e);
        }
        return users;
    }
}
