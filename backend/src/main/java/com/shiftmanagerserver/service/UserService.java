package com.shiftmanagerserver.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.type.CollectionType;
import com.shiftmanagerserver.entities.User;
import io.vertx.core.json.JsonObject;
import org.mindrot.jbcrypt.BCrypt;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

public class UserService {
    private static final Logger logger = LoggerFactory.getLogger(UserService.class);
    private static final String USERS_FILE = "users.json";
    private final ObjectMapper objectMapper;
    private final List<User> users;

    public UserService() {
        this.objectMapper = new ObjectMapper();
        this.users = loadUsers();
    }

    private List<User> loadUsers() {
        File file = new File(USERS_FILE);
        if (!file.exists()) {
            logger.info("Users file not found, creating new user list");
            return new ArrayList<>();
        }

        try {
            CollectionType listType = objectMapper.getTypeFactory()
                    .constructCollectionType(ArrayList.class, User.class);
            List<User> loadedUsers = objectMapper.readValue(file, listType);
            logger.info("Successfully loaded {} users from file", loadedUsers.size());
            return loadedUsers;
        } catch (IOException e) {
            logger.error("Error loading users from file", e);
            return new ArrayList<>();
        }
    }

    private void saveUsers() {
        try {
            objectMapper.writeValue(new File(USERS_FILE), users);
            logger.info("Successfully saved {} users to file", users.size());
        } catch (IOException e) {
            logger.error("Error saving users to file", e);
            throw new RuntimeException("Failed to save users", e);
        }
    }

    public boolean createUser(User user) {
        if (userExists(user.getName())) {
            return false;
        }

        String hashedPassword = BCrypt.hashpw(user.getPassword(), BCrypt.gensalt());
        user.setPassword(hashedPassword);
        user.setScore(this.getAverageUserScore());
        users.add(user);
        saveUsers();
        return true;
    }

    private boolean userExists(String username) {
        return users.stream()
                .anyMatch(u -> u.getName().equals(username));
    }

    public boolean authenticateUser(String username, String password) {
        return users.stream()
                .filter(u -> u.getName().equals(username))
                .findFirst()
                .map(user -> BCrypt.checkpw(password, user.getPassword()))
                .orElse(false);
    }

    public List<User> getAllUsers() {
        return new ArrayList<>(users);
    }

    public User getUserById(String id) {
        return users.stream()
                .filter(u -> u.getName().equals(id))
                .findFirst()
                .orElse(null);
    }

    public User updateUser(String id, JsonObject updates) {
        User user = getUserById(id);
        if (user == null) return null;
        if (updates.containsKey("name")) {
            user.setName(updates.getString("name"));
        }
        if (updates.containsKey("score")) {
            user.setScore(updates.getInteger("score"));
        }
        saveUsers();
        return user;
    }

    public boolean deleteUser(String id) {
        boolean removed = users.removeIf(u -> u.getName().equals(id));
        if (removed) {
            saveUsers();
        }
        return removed;
    }

    public int getAverageUserScore() {
        if (users.isEmpty()) {
            return 0;
        }
        return (int) Math.round(users.stream()
                .mapToInt(User::getScore)
                .average()
                .orElse(0));
    }
}
