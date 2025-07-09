package com.shiftmanagerserver.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.inject.Inject;
import com.google.inject.name.Named;
import com.shiftmanagerserver.dao.AsyncIO;
import com.shiftmanagerserver.entities.*;
import io.vertx.core.Future;
import io.vertx.core.Promise;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutionException;

public class ShiftService {
    private static final Logger logger = LoggerFactory.getLogger(ShiftService.class);
    private final ObjectMapper objectMapper;
    private final ShiftWeightSettingsService shiftWeightSettingsService;
    private final AsyncIO<List<AssignedShift>, List<AssignedShift>> shiftDao;
    private List<AssignedShift> shifts;
    private boolean initialized = false;

    @Inject
    public ShiftService(ObjectMapper objectMapper,
                       @Named("shift.dao") AsyncIO<List<AssignedShift>, List<AssignedShift>> shiftDao,
                       ShiftWeightSettingsService shiftWeightSettingsService) {
        this.objectMapper = objectMapper;
        this.shiftDao = shiftDao;
        this.shiftWeightSettingsService = shiftWeightSettingsService;
        this.shifts = new ArrayList<>();
        // Don't load shifts in constructor - wait for Redis to be ready
    }

    private void ensureInitialized() {
        if (!initialized) {
            loadShiftsAsync();
            initialized = true;
        }
    }

    private Future<Void> loadShiftsAsync() {
        Promise<Void> promise = Promise.promise();
        
        shiftDao.read()
            .onSuccess(loadedShifts -> {
                this.shifts = loadedShifts;
                logger.info("Successfully loaded {} shifts from Redis", loadedShifts.size());
                promise.complete();
            })
            .onFailure(err -> {
                logger.error("Error loading shifts from Redis", err);
                this.shifts = new ArrayList<>();
                promise.complete(); // Complete with empty list rather than fail
            });
            
        return promise.future();
    }

    private Future<Void> saveShiftsAsync() {
        return shiftDao.write(shifts)
            .onSuccess(v -> logger.info("Successfully saved {} shifts to Redis", shifts.size()))
            .onFailure(err -> logger.error("Error saving shifts to Redis", err));
    }

    public Future<List<AssignedShift>> getAllShifts() {
        Promise<List<AssignedShift>> promise = Promise.promise();
        
        if (!initialized) {
            loadShiftsAsync()
                .onSuccess(v -> {
                    initialized = true;
                    promise.complete(new ArrayList<>(shifts));
                })
                .onFailure(err -> {
                    logger.error("Error loading shifts", err);
                    promise.fail(err);
                });
        } else {
            promise.complete(new ArrayList<>(shifts));
        }
        return promise.future();
    }

    public Future<Void> addShifts(List<AssignedShift> newShifts) {
        Promise<Void> promise = Promise.promise();
        
        if (!initialized) {
            loadShiftsAsync()
                .onSuccess(v -> {
                    initialized = true;
                    proceedWithAddShifts(newShifts, promise);
                })
                .onFailure(err -> {
                    logger.error("Error loading shifts", err);
                    promise.fail(err);
                });
        } else {
            proceedWithAddShifts(newShifts, promise);
        }
            
        return promise.future();
    }

    private void proceedWithAddShifts(List<AssignedShift> newShifts, Promise<Void> promise) {
        for (AssignedShift shift : newShifts) {
            shifts.removeIf(s -> s.equals(shift));
            shift.setUuid(UUID.randomUUID());
            shifts.add(shift);
        }
        
        saveShiftsAsync()
            .onSuccess(v -> promise.complete())
            .onFailure(err -> promise.fail(err));
    }

    public Future<Boolean> deleteShift(Date date, ShiftType type) {
        Promise<Boolean> promise = Promise.promise();
        
        if (!initialized) {
            loadShiftsAsync()
                .onSuccess(v -> {
                    initialized = true;
                    proceedWithDeleteShift(date, type, promise);
                })
                .onFailure(err -> {
                    logger.error("Error loading shifts", err);
                    promise.fail(err);
                });
        } else {
            proceedWithDeleteShift(date, type, promise);
        }
            
        return promise.future();
    }

    private void proceedWithDeleteShift(Date date, ShiftType type, Promise<Boolean> promise) {
        int initialSize = shifts.size();
        shifts.removeIf(s -> s.equals(new Shift(date, type)));
        boolean removed = shifts.size() < initialSize;
        
        if (removed) {
            saveShiftsAsync()
                .onSuccess(v -> promise.complete(true))
                .onFailure(err -> promise.fail(err));
        } else {
            promise.complete(false);
        }
    }

    public Future<List<AssignedShift>> suggestShiftAssignment(List<Shift> shifts, Map<User, List<Constraint>> userToConstraints) {
        Promise<List<AssignedShift>> promise = Promise.promise();
        
        // First get the settings asynchronously
        shiftWeightSettingsService.getSettings()
            .onSuccess(settings -> {
                try {
                    List<User> users = new ArrayList<>(userToConstraints.keySet().stream().toList());
                    String currentPreset = settings.getCurrentPreset();
                    List<ShiftWeight> shiftsWeight = settings.getPresets().get(currentPreset).getWeights();
                    List<Shift> shiftsToAssign = new ArrayList<>(shifts);
                    shiftsWeight.sort((a, b) -> Integer.compare(b.getWeight(), a.getWeight()));
                    users.sort(Comparator.comparingInt(User::getScore));

                    List<AssignedShift> assignedShifts = new ArrayList<>();
                    Map<String, List<Shift>> userShifts = new HashMap<>();
                    Map<String, Integer> userMissedDays = new HashMap<>();

                    for (User user : users) {
                        userShifts.put(user.getName(), new ArrayList<>());
                        userMissedDays.put(user.getName(), 0);
                    }

                    int shiftIndex = 0;

                    for (ShiftWeight shiftWeight : shiftsWeight) {
                        Optional<Shift> matchedShiftOpt = findMatchingShift(shiftWeight, shiftsToAssign);

                        if (matchedShiftOpt.isEmpty()) {
                            logger.warn("No matching shift found for: " + shiftWeight.getDay() + " " + shiftWeight.getShiftType());
                            continue;
                        }

                        Shift newShift = matchedShiftOpt.get();
                        shiftsToAssign.remove(newShift);

                        boolean assigned = false;

                        users.sort(Comparator.comparingInt(User::getScore));

                        for (User user : users) {
                            String userId = user.getName();
                            List<Constraint> constraints = userToConstraints.get(user);
                            List<Shift> pastShifts = userShifts.get(userId);
                            int currentMissed = userMissedDays.get(userId);

                            boolean blocked = constraints.stream().anyMatch(c ->
                                    c.getUserId().equals(userId) &&
                                            c.getShift().getType() == newShift.getType() &&
                                            isSameDay(c.getShift().getDate(), newShift.getDate()) &&
                                            c.getConstraintType() == ConstraintType.CANT
                            );

                            if (blocked)
                                continue;

                            // Enforce 48 gap between shifts
                            boolean has48hGap = pastShifts.stream().allMatch(s ->
                                    Math.abs(s.getDate().getTime() - newShift.getDate().getTime()) >= 48L * 60 * 60 * 1000
                            );

                            if (!has48hGap)
                                continue;

                            // Enforce max 2 missed office days
                            int missedDaysForShift = 0;
                            if (ShiftWeightPresetType.IMMEDIATE.getHebrewName().equals(currentPreset)) {
                                missedDaysForShift = calculateMissedDays(shiftWeight.getDay(), shiftWeight.getShiftType());
                                if ((currentMissed + missedDaysForShift) > 2)
                                    continue;
                            }

                            AssignedShift assignedShift = new AssignedShift(userId, newShift);
                            assignedShifts.add(assignedShift);
                            user.setScore(user.getScore() + shiftWeight.getWeight());

                            pastShifts.add(newShift);
                            userMissedDays.put(userId, currentMissed + missedDaysForShift);

                            assigned = true;
                            break;
                        }

                        if (!assigned) {
                            logger.warn("No suitable user found for shift: " + newShift.getDate() + " " + newShift.getType());
                        }
                    }

                    promise.complete(assignedShifts);

                } catch (Exception e) {
                    logger.error("Error assigning shifts", e);
                    promise.fail(e);
                }
            })
            .onFailure(err -> {
                logger.error("Error getting shift weight settings", err);
                promise.fail(err);
            });

        return promise.future();
    }

    private int calculateMissedDays(Day day, ShiftType type) {
        return switch (type) {
            case DAY -> {
                if (Arrays.stream(new Day[]{Day.FRIDAY, Day.SATURDAY}).toList().contains(day)) yield 0;
                yield 1;
            }
            case NIGHT -> {
                if (Arrays.stream(new Day[]{Day.THURSDAY, Day.SATURDAY}).toList().contains(day)) yield 1;
                if (Arrays.stream(new Day[]{Day.FRIDAY}).toList().contains(day)) yield 0;
                yield 2;
            }
        };
    }

    private Optional<Shift> findMatchingShift(ShiftWeight shiftWeight, List<Shift> availableShifts) {
        Map<String, Integer> hebrewDayToCalendarDay = Map.of(
                Day.SUNDAY.getHebrewName(), Calendar.SUNDAY,
                Day.MONDAY.getHebrewName(), Calendar.MONDAY,
                Day.TUESDAY.getHebrewName(), Calendar.TUESDAY,
                Day.WEDNESDAY.getHebrewName(), Calendar.WEDNESDAY,
                Day.THURSDAY.getHebrewName(), Calendar.THURSDAY,
                Day.FRIDAY.getHebrewName(), Calendar.FRIDAY,
                Day.SATURDAY.getHebrewName(), Calendar.SATURDAY
        );

        Integer calendarDay = hebrewDayToCalendarDay.get(shiftWeight.getDay().getHebrewName());
        if (calendarDay == null) {
            return Optional.empty(); // Unknown day
        }

        return availableShifts.stream()
                .filter(s -> {
                    Calendar cal = Calendar.getInstance();
                    cal.setTime(s.getDate());
                    int shiftDayOfWeek = cal.get(Calendar.DAY_OF_WEEK);
                    return shiftDayOfWeek == calendarDay && s.getType() == shiftWeight.getShiftType();
                })
                .findFirst();
    }

    private boolean isSameDay(Date d1, Date d2) {
        Calendar cal1 = Calendar.getInstance();
        cal1.setTime(d1);
        Calendar cal2 = Calendar.getInstance();
        cal2.setTime(d2);
        return cal1.get(Calendar.YEAR) == cal2.get(Calendar.YEAR)
                && cal1.get(Calendar.DAY_OF_YEAR) == cal2.get(Calendar.DAY_OF_YEAR);
    }

    // Synchronous methods for backward compatibility
    public List<AssignedShift> getAllShiftsSync() {
        try {
            return getAllShifts().toCompletionStage().toCompletableFuture().get();
        } catch (InterruptedException | ExecutionException e) {
            logger.error("Error in synchronous shift retrieval", e);
            return new ArrayList<>();
        }
    }

    public void addShiftsSync(List<AssignedShift> newShifts) {
        try {
            addShifts(newShifts).toCompletionStage().toCompletableFuture().get();
        } catch (InterruptedException | ExecutionException e) {
            logger.error("Error in synchronous shift addition", e);
        }
    }

    public boolean deleteShiftSync(Date date, ShiftType type) {
        try {
            return deleteShift(date, type).toCompletionStage().toCompletableFuture().get();
        } catch (InterruptedException | ExecutionException e) {
            logger.error("Error in synchronous shift deletion", e);
            return false;
        }
    }
}
