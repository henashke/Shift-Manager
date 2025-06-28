package com.shiftmanagerserver.service;

import com.shiftmanagerserver.entities.Constraint;
import com.shiftmanagerserver.entities.User;
import io.vertx.core.Future;
import io.vertx.core.json.JsonObject;

import java.util.Set;
import java.util.UUID;

public interface IUserService<T, S> {

    /**
     * Retrieves a user by their ID.
     *
     * @param id the ID of the user to retrieve
     * @return a Future containing the user if found, or a failed future if not found
     */
    Future<T> getUserById(String id);

    /**
     * Creates a new user.
     *
     * @param user the user to create
     * @return a Future containing the created user
     */
    Future<T> createUser(User user);

    /**
     * Updates an existing user.
     *
     * @param id      the ID of the user to update
     * @param updates the updates to apply to the user
     * @return a Future containing the updated user
     */
    Future<T> updateUser(String id, JsonObject updates);

    /**
     * Deletes a user by their ID.
     *
     * @param id the ID of the user to delete
     * @return a Future that completes when the user is deleted, or fails if the user is not found
     */
    Future<Void> deleteUser(S id);

    /**
     * Gets the set of all users.
     *
     * @return the set of all users
     */
    Future<Set<T>> users();

    Future<S> updatePreferences(UUID id, Set<Constraint> preferences);
}
