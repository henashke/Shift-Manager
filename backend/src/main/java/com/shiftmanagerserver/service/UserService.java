package com.shiftmanagerserver.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.inject.Inject;
import com.google.inject.name.Named;
import com.shiftmanagerserver.dao.AsyncIO;
import com.shiftmanagerserver.entities.User;
import io.vertx.core.Future;
import io.vertx.core.Promise;
import io.vertx.core.json.JsonObject;
import org.mindrot.jbcrypt.BCrypt;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutionException;
import java.util.Optional;

public class UserService {
    private static final Logger logger = LoggerFactory.getLogger(UserService.class);
    private final ObjectMapper objectMapper;
    private final AsyncIO<Set<User>, Set<User>> userDao;
    private Set<User> users;
    private boolean initialized = false;

    @Inject
    public UserService(ObjectMapper objectMapper,
                      @Named("user.dao") AsyncIO<Set<User>, Set<User>> userDao) {
        this.objectMapper = objectMapper;
        this.userDao = userDao;
        this.users = new HashSet<>();
    }

    public void ensureAdminUser() {
        String adminUsername = System.getenv().getOrDefault("ADMIN_USERNAME", "admin");
        String adminPassword = System.getenv().getOrDefault("ADMIN_PASSWORD", "P@ssw0rd");
        loadUsersAsync().onSuccess(v -> {
            Optional<User> adminOpt = users.stream().filter(u -> u.getName().equals(adminUsername)).findFirst();
            if (adminOpt.isEmpty()) {
                User admin = new User();
                admin.setName(adminUsername);
                admin.setPassword(org.mindrot.jbcrypt.BCrypt.hashpw(adminPassword, org.mindrot.jbcrypt.BCrypt.gensalt()));
                admin.setRole("admin");
                admin.setScore(0);
                users.add(admin);
                saveUsersAsync().onSuccess(v2 ->
                    logger.info("Admin user '{}' created from environment variable.", adminUsername)
                ).onFailure(err ->
                    logger.error("Failed to save admin user to Redis", err)
                );
            } else {
                logger.info("Admin user '{}' already exists.", adminUsername);
            }
        }).onFailure(err -> logger.error("Failed to load users for admin check", err));
    }

    private Future<Void> loadUsersAsync() {
        Promise<Void> promise = Promise.promise();
        
        userDao.read()
            .onSuccess(loadedUsers -> {
                this.users = loadedUsers;
                logger.info("Successfully loaded {} users from Redis", loadedUsers.size());
                promise.complete();
            })
            .onFailure(err -> {
                logger.error("Error loading users from Redis", err);
                this.users = new HashSet<>();
                promise.complete(); // Complete with empty set rather than fail
            });
            
        return promise.future();
    }

    protected Future<Void> saveUsersAsync() {
        return userDao.write(users)
            .onSuccess(v -> logger.info("Successfully saved {} users to Redis", users.size()))
            .onFailure(err -> logger.error("Error saving users to Redis", err));
    }

    public Future<Boolean> createUser(User user) {
        Promise<Boolean> promise = Promise.promise();
        
        // Ensure initialization is complete before proceeding
        if (!initialized) {
            loadUsersAsync()
                .onSuccess(v -> {
                    initialized = true;
                    proceedWithUserCreation(user, promise);
                })
                .onFailure(err -> {
                    logger.error("Failed to initialize users", err);
                    promise.fail(err);
                });
        } else {
            proceedWithUserCreation(user, promise);
        }
            
        return promise.future();
    }

    private void proceedWithUserCreation(User user, Promise<Boolean> promise) {
        if (userExists(user.getName())) {
            promise.complete(false);
            return;
        }

        String hashedPassword = BCrypt.hashpw(user.getPassword(), BCrypt.gensalt());
        user.setPassword(hashedPassword);
        user.setScore(this.getAverageUserScore());
        users.add(user);
        
        saveUsersAsync()
            .onSuccess(v -> promise.complete(true))
            .onFailure(err -> {
                users.remove(user); // Rollback on failure
                promise.fail(err);
            });
    }

    private boolean userExists(String username) {
        return users.stream()
                .anyMatch(u -> u.getName().equals(username));
    }

    public Future<Boolean> authenticateUser(String username, String password) {
        Promise<Boolean> promise = Promise.promise();
        
        if (!initialized) {
            loadUsersAsync()
                .onSuccess(v -> {
                    initialized = true;
                    proceedWithUserAuthentication(username, password, promise);
                })
                .onFailure(err -> {
                    logger.error("Failed to initialize users", err);
                    promise.fail(err);
                });
        } else {
            proceedWithUserAuthentication(username, password, promise);
        }
            
        return promise.future();
    }

    private void proceedWithUserAuthentication(String username, String password, Promise<Boolean> promise) {
        boolean authenticated = users.stream()
                .filter(u -> u.getName().equals(username))
                .findFirst()
                .map(user -> BCrypt.checkpw(password, user.getPassword()))
                .orElse(false);
                
        promise.complete(authenticated);
    }

    public Future<List<User>> getAllUsers() {
        Promise<List<User>> promise = Promise.promise();
        loadUsersAsync()
            .onSuccess(v -> {
                // Filter out admin users from the list
                String adminUsername = System.getenv().getOrDefault("ADMIN_USERNAME", "admin");
                List<User> nonAdminUsers = users.stream()
                    .filter(user -> !"admin".equals(user.getRole()) && !adminUsername.equals(user.getName()))
                    .collect(java.util.stream.Collectors.toList());
                promise.complete(nonAdminUsers);
            })
            .onFailure(err -> {
                logger.error("Error loading users", err);
                promise.fail(err);
            });
        return promise.future();
    }

    public Future<User> getUserById(String id) {
        Promise<User> promise = Promise.promise();
        
        if (!initialized) {
            loadUsersAsync()
                .onSuccess(v -> {
                    initialized = true;
                    User user = users.stream()
                            .filter(u -> u.getName().equals(id))
                            .findFirst()
                            .orElse(null);
                    promise.complete(user);
                })
                .onFailure(err -> {
                    logger.error("Error loading user", err);
                    promise.fail(err);
                });
        } else {
            User user = users.stream()
                    .filter(u -> u.getName().equals(id))
                    .findFirst()
                    .orElse(null);
            promise.complete(user);
        }
        return promise.future();
    }

    public Future<User> updateUser(String id, JsonObject updates) {
        Promise<User> promise = Promise.promise();
        
        if (!initialized) {
            loadUsersAsync()
                .onSuccess(v -> {
                    initialized = true;
                    User user = users.stream()
                            .filter(u -> u.getName().equals(id))
                            .findFirst()
                            .orElse(null);
                    if (user == null) {
                        promise.complete(null);
                        return;
                    }
                    
                    if (updates.containsKey("name")) {
                        user.setName(updates.getString("name"));
                    }
                    if (updates.containsKey("score")) {
                        user.setScore(updates.getInteger("score"));
                    }
                    
                    saveUsersAsync()
                        .onSuccess(v2 -> promise.complete(user))
                        .onFailure(err -> promise.fail(err));
                })
                .onFailure(err -> {
                    logger.error("Error loading user", err);
                    promise.fail(err);
                });
        } else {
            User user = users.stream()
                    .filter(u -> u.getName().equals(id))
                    .findFirst()
                    .orElse(null);
            if (user == null) {
                promise.complete(null);
                return promise.future();
            }
            
            if (updates.containsKey("name")) {
                user.setName(updates.getString("name"));
            }
            if (updates.containsKey("score")) {
                user.setScore(updates.getInteger("score"));
            }
            
            saveUsersAsync()
                .onSuccess(v -> promise.complete(user))
                .onFailure(err -> promise.fail(err));
        }
        return promise.future();
    }

    public Future<Boolean> deleteUser(String id) {
        Promise<Boolean> promise = Promise.promise();
        
        if (!initialized) {
            loadUsersAsync()
                .onSuccess(v -> {
                    initialized = true;
                    boolean removed = users.removeIf(u -> u.getName().equals(id));
                    if (removed) {
                        saveUsersAsync()
                            .onSuccess(v2 -> promise.complete(true))
                            .onFailure(err -> {
                                // Rollback on failure
                                loadUsersAsync();
                                promise.fail(err);
                            });
                    } else {
                        promise.complete(false);
                    }
                })
                .onFailure(err -> {
                    logger.error("Error loading users", err);
                    promise.fail(err);
                });
        } else {
            boolean removed = users.removeIf(u -> u.getName().equals(id));
            if (removed) {
                saveUsersAsync()
                    .onSuccess(v -> promise.complete(true))
                    .onFailure(err -> {
                        // Rollback on failure
                        loadUsersAsync();
                        promise.fail(err);
                    });
            } else {
                promise.complete(false);
            }
        }
        return promise.future();
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

    // Synchronous methods for backward compatibility
    public boolean createUserSync(User user) {
        try {
            return createUser(user).toCompletionStage().toCompletableFuture().get();
        } catch (InterruptedException | ExecutionException e) {
            logger.error("Error in synchronous user creation", e);
            return false;
        }
    }

    public boolean authenticateUserSync(String username, String password) {
        try {
            return authenticateUser(username, password).toCompletionStage().toCompletableFuture().get();
        } catch (InterruptedException | ExecutionException e) {
            logger.error("Error in synchronous user authentication", e);
            return false;
        }
    }

    public List<User> getAllUsersSync() {
        try {
            return getAllUsers().toCompletionStage().toCompletableFuture().get();
        } catch (InterruptedException | ExecutionException e) {
            logger.error("Error in synchronous user retrieval", e);
            return new ArrayList<>();
        }
    }

    public User getUserByIdSync(String id) {
        try {
            return getUserById(id).toCompletionStage().toCompletableFuture().get();
        } catch (InterruptedException | ExecutionException e) {
            logger.error("Error in synchronous user retrieval", e);
            return null;
        }
    }

    public User getUserByNameSync(String username) {
        if (!initialized) {
            try {
                loadUsersAsync().toCompletionStage().toCompletableFuture().get();
                initialized = true;
            } catch (Exception e) {
                logger.error("Error loading users for getUserByNameSync", e);
                return null;
            }
        }
        return users.stream().filter(u -> u.getName().equals(username)).findFirst().orElse(null);
    }
}
