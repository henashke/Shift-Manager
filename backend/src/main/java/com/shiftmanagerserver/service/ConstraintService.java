package com.shiftmanagerserver.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.inject.Inject;
import com.google.inject.name.Named;
import com.shiftmanagerserver.dao.AsyncIO;
import com.shiftmanagerserver.entities.Constraint;
import com.shiftmanagerserver.entities.Shift;
import io.vertx.core.Future;
import io.vertx.core.Promise;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutionException;
import java.util.stream.Collectors;

public class ConstraintService {
    private static final Logger logger = LoggerFactory.getLogger(ConstraintService.class);
    private final ObjectMapper objectMapper;
    private final AsyncIO<List<Constraint>, List<Constraint>> constraintDao;
    private List<Constraint> constraints;
    private boolean initialized = false;

    @Inject
    public ConstraintService(ObjectMapper objectMapper,
                           @Named("constraint.dao") AsyncIO<List<Constraint>, List<Constraint>> constraintDao) {
        this.objectMapper = objectMapper;
        this.constraintDao = constraintDao;
        this.constraints = new ArrayList<>();
        // Don't load constraints in constructor - wait for Redis to be ready
    }

    private Future<Void> loadConstraintsAsync() {
        Promise<Void> promise = Promise.promise();
        
        constraintDao.read()
            .onSuccess(loadedConstraints -> {
                this.constraints = loadedConstraints;
                logger.info("Successfully loaded {} constraints from Redis", loadedConstraints.size());
                promise.complete();
            })
            .onFailure(err -> {
                logger.error("Error loading constraints from Redis", err);
                this.constraints = new ArrayList<>();
                promise.complete(); // Complete with empty list rather than fail
            });
            
        return promise.future();
    }

    private Future<Void> saveConstraintsAsync() {
        return constraintDao.write(constraints)
            .onSuccess(v -> logger.info("Successfully saved {} constraints to Redis", constraints.size()))
            .onFailure(err -> logger.error("Error saving constraints to Redis", err));
    }

    public Future<Constraint> createConstraint(Constraint constraint) {
        Promise<Constraint> promise = Promise.promise();
        
        if (!initialized) {
            loadConstraintsAsync()
                .onSuccess(v -> {
                    initialized = true;
                    proceedWithCreateConstraint(constraint, promise);
                })
                .onFailure(err -> {
                    logger.error("Error loading constraints", err);
                    promise.fail(err);
                });
        } else {
            proceedWithCreateConstraint(constraint, promise);
        }
            
        return promise.future();
    }

    private void proceedWithCreateConstraint(Constraint constraint, Promise<Constraint> promise) {
        constraints.add(constraint);
        
        saveConstraintsAsync()
            .onSuccess(v -> promise.complete(constraint))
            .onFailure(err -> {
                constraints.remove(constraint); // Rollback on failure
                promise.fail(err);
            });
    }

    public Future<List<Constraint>> getConstraintsByUserId(String userId) {
        Promise<List<Constraint>> promise = Promise.promise();
        
        if (!initialized) {
            loadConstraintsAsync()
                .onSuccess(v -> {
                    initialized = true;
                    List<Constraint> userConstraints = constraints.stream()
                            .filter(c -> c.getUserId().equals(userId))
                            .collect(Collectors.toList());
                    promise.complete(userConstraints);
                })
                .onFailure(err -> {
                    logger.error("Error loading constraints", err);
                    promise.fail(err);
                });
        } else {
            List<Constraint> userConstraints = constraints.stream()
                    .filter(c -> c.getUserId().equals(userId))
                    .collect(Collectors.toList());
            promise.complete(userConstraints);
        }
        return promise.future();
    }

    public Future<Boolean> deleteConstraint(String userId, Shift shift) {
        Promise<Boolean> promise = Promise.promise();
        
        if (!initialized) {
            loadConstraintsAsync()
                .onSuccess(v -> {
                    initialized = true;
                    proceedWithDeleteConstraint(userId, shift, promise);
                })
                .onFailure(err -> {
                    logger.error("Error loading constraints", err);
                    promise.fail(err);
                });
        } else {
            proceedWithDeleteConstraint(userId, shift, promise);
        }
            
        return promise.future();
    }

    private void proceedWithDeleteConstraint(String userId, Shift shift, Promise<Boolean> promise) {
        int initialSize = constraints.size();
        constraints.removeIf(c ->
                c.getUserId().equals(userId) &&
                        c.getShift().equals(shift)
        );
        boolean removed = constraints.size() < initialSize;
        
        if (removed) {
            saveConstraintsAsync()
                .onSuccess(v -> promise.complete(true))
                .onFailure(err -> {
                    // Rollback on failure
                    loadConstraintsAsync();
                    promise.fail(err);
                });
        } else {
            promise.complete(false);
        }
    }

    public Future<List<Constraint>> getAllConstraints() {
        Promise<List<Constraint>> promise = Promise.promise();
        
        if (!initialized) {
            loadConstraintsAsync()
                .onSuccess(v -> {
                    initialized = true;
                    promise.complete(new ArrayList<>(constraints));
                })
                .onFailure(err -> {
                    logger.error("Error loading constraints", err);
                    promise.fail(err);
                });
        } else {
            promise.complete(new ArrayList<>(constraints));
        }
        return promise.future();
    }

    public Future<List<Constraint>> addConstraints(List<Constraint> newConstraints) {
        Promise<List<Constraint>> promise = Promise.promise();
        
        if (!initialized) {
            loadConstraintsAsync()
                .onSuccess(v -> {
                    initialized = true;
                    proceedWithAddConstraints(newConstraints, promise);
                })
                .onFailure(err -> {
                    logger.error("Error loading constraints", err);
                    promise.fail(err);
                });
        } else {
            proceedWithAddConstraints(newConstraints, promise);
        }
            
        return promise.future();
    }

    private void proceedWithAddConstraints(List<Constraint> newConstraints, Promise<List<Constraint>> promise) {
        constraints.addAll(newConstraints);
        
        saveConstraintsAsync()
            .onSuccess(v -> promise.complete(newConstraints))
            .onFailure(err -> {
                // Rollback on failure
                newConstraints.forEach(constraints::remove);
                promise.fail(err);
            });
    }

    // Synchronous methods for backward compatibility
    public Constraint createConstraintSync(Constraint constraint) {
        try {
            return createConstraint(constraint).toCompletionStage().toCompletableFuture().get();
        } catch (InterruptedException | ExecutionException e) {
            logger.error("Error in synchronous constraint creation", e);
            return null;
        }
    }

    public List<Constraint> getConstraintsByUserIdSync(String userId) {
        try {
            return getConstraintsByUserId(userId).toCompletionStage().toCompletableFuture().get();
        } catch (InterruptedException | ExecutionException e) {
            logger.error("Error in synchronous constraint retrieval", e);
            return new ArrayList<>();
        }
    }

    public boolean deleteConstraintSync(String userId, Shift shift) {
        try {
            return deleteConstraint(userId, shift).toCompletionStage().toCompletableFuture().get();
        } catch (InterruptedException | ExecutionException e) {
            logger.error("Error in synchronous constraint deletion", e);
            return false;
        }
    }

    public List<Constraint> getAllConstraintsSync() {
        try {
            return getAllConstraints().toCompletionStage().toCompletableFuture().get();
        } catch (InterruptedException | ExecutionException e) {
            logger.error("Error in synchronous constraint retrieval", e);
            return new ArrayList<>();
        }
    }

    public List<Constraint> addConstraintsSync(List<Constraint> newConstraints) {
        try {
            return addConstraints(newConstraints).toCompletionStage().toCompletableFuture().get();
        } catch (InterruptedException | ExecutionException e) {
            logger.error("Error in synchronous constraint addition", e);
            return new ArrayList<>();
        }
    }
}
