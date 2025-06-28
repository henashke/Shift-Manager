package com.shiftmanagerserver.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.shiftmanagerserver.entities.Constraint;
import com.shiftmanagerserver.entities.Shift;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

public class ConstraintService {
    private static final Logger logger = LoggerFactory.getLogger(ConstraintService.class);
    private static final String CONSTRAINTS_FILE = "constraints.json";
    private final ObjectMapper objectMapper;
    private List<Constraint> constraints;

    public ConstraintService() {
        this.objectMapper = new ObjectMapper();
        this.constraints = new ArrayList<>();
        loadConstraints();
    }

    public Constraint createConstraint(Constraint constraint) {
        constraints.add(constraint);
        saveConstraints();
        return constraint;
    }

    public List<Constraint> getConstraintsByUserId(String userId) {
        return constraints.stream()
                .filter(c -> c.getUserId().equals(userId))
                .collect(Collectors.toList());
    }

    public boolean deleteConstraint(String userId, Shift shift) {
        int initialSize = constraints.size();
        constraints.removeIf(c ->
                c.getUserId().equals(userId) &&
                        c.getShift().equals(shift)
        );
        boolean removed = constraints.size() < initialSize;
        if (removed) {
            saveConstraints();
        }
        return removed;
    }

    public List<Constraint> getAllConstraints() {
        return new ArrayList<>(constraints);
    }

    public List<Constraint> addConstraints(List<Constraint> newConstraints) {
        constraints.addAll(newConstraints);
        saveConstraints();
        return newConstraints;
    }

    private void loadConstraints() {
        File file = new File(CONSTRAINTS_FILE);
        if (file.exists()) {
            try {
                constraints = objectMapper.readValue(file, new TypeReference<>() {
                });
            } catch (IOException e) {
                logger.error("Error loading constraints from file", e);
                throw new RuntimeException("Failed to load constraints", e);
            }
        }
    }

    private void saveConstraints() {
        try {
            objectMapper.writeValue(new File(CONSTRAINTS_FILE), constraints);
        } catch (IOException e) {
            logger.error("Error saving constraints to file", e);
            throw new RuntimeException("Failed to save constraints", e);
        }
    }
}
