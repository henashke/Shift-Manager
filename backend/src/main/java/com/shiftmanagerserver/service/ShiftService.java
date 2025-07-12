package com.shiftmanagerserver.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.inject.Inject;
import com.google.inject.name.Named;
import com.shiftmanagerserver.dao.AsyncIO;
import com.shiftmanagerserver.entities.*;
import io.vertx.core.Future;
import io.vertx.core.Promise;
import io.vertx.core.Vertx;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.*;

public class ShiftService {
    private static final Logger logger = LoggerFactory.getLogger(ShiftService.class);
    private final ObjectMapper objectMapper;
    private final UserService userService;
    private final ShiftWeightSettingsService shiftWeightSettingsService;
    private final AsyncIO<List<AssignedShift>, List<AssignedShift>> shiftDao;
    private List<AssignedShift> shifts;
    private boolean initialized = false;

    @Inject
    public ShiftService(ObjectMapper objectMapper,
                        @Named("shift.dao") AsyncIO<List<AssignedShift>, List<AssignedShift>> shiftDao,
                        ShiftWeightSettingsService shiftWeightSettingsService,
                        UserService userService) {
        this.objectMapper = objectMapper;
        this.shiftDao = shiftDao;
        this.shiftWeightSettingsService = shiftWeightSettingsService;
        this.userService = userService;
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
        shiftWeightSettingsService.getSettings().onSuccess(settings -> {
            String currentPreset = settings.getCurrentPreset();
            var preset = settings.getPresets().get(currentPreset);
            userService.getAllUsers().onSuccess(users -> {
                Map<String, User> userMap = new HashMap<>();
                for (User u : users) userMap.put(u.getName(), u);

                // Determine the date range of newShifts
                Date minDate = null, maxDate = null;
                for (AssignedShift s : newShifts) {
                    if (minDate == null || s.getDate().before(minDate)) minDate = s.getDate();
                    if (maxDate == null || s.getDate().after(maxDate)) maxDate = s.getDate();
                }

                // Only consider old shifts within the date range of newShifts
                List<AssignedShift> toRemove = new ArrayList<>();
                for (AssignedShift oldShift : new ArrayList<>(shifts)) {
                    boolean inRange = false;
                    if (minDate != null && maxDate != null) {
                        inRange = !oldShift.getDate().before(minDate) && !oldShift.getDate().after(maxDate);
                    }
                    if (!inRange) continue; // Only process shifts in the range

                    AssignedShift newShift = newShifts.stream()
                            .filter(s -> s.getDate().equals(oldShift.getDate()) && s.getType() == oldShift.getType())
                            .findFirst().orElse(null);
                    boolean assignmentChanged = false;
                    if (newShift == null) {
                        // Shift was removed (in this week)
                        assignmentChanged = true;
                    } else if (!Objects.equals(oldShift.getAssignedUsername(), newShift.getAssignedUsername())) {
                        // Assignment changed (including unassigned)
                        assignmentChanged = true;
                    }
                    if (assignmentChanged && oldShift.getAssignedUsername() != null) {
                        User user = userMap.get(oldShift.getAssignedUsername());
                        if (user != null) {
                            int weight = preset.getWeights().stream()
                                    .filter(w -> w.getDay() == getDayOfWeek(oldShift.getDate()) && w.getShiftType() == oldShift.getType())
                                    .map(ShiftWeight::getWeight)
                                    .findFirst().orElse(1);
                            int newScore = user.getScore() - weight;
                            user.setScore(Math.max(0, newScore));
                        }
                    }
                    if (assignmentChanged) {
                        toRemove.add(oldShift);
                    }
                }
                // Remove old shifts that are replaced or deleted (only in range)
                for (AssignedShift shift : toRemove) {
                    shifts.remove(shift);
                }
                // Add new shifts and update scores for new assignments
                for (AssignedShift shift : newShifts) {
                    shifts.removeIf(s -> s.getDate().equals(shift.getDate()) && s.getType() == shift.getType());
                    shift.setUuid(UUID.randomUUID());
                    shifts.add(shift);
                    if (shift.getAssignedUsername() != null) {
                        AssignedShift prev = toRemove.stream()
                                .filter(s -> s.getDate().equals(shift.getDate()) && s.getType() == shift.getType())
                                .findFirst().orElse(null);
                        if (prev == null || !Objects.equals(prev.getAssignedUsername(), shift.getAssignedUsername())) {
                            User user = userMap.get(shift.getAssignedUsername());
                            if (user != null) {
                                int weight = preset.getWeights().stream()
                                        .filter(w -> w.getDay() == getDayOfWeek(shift.getDate()) && w.getShiftType() == shift.getType())
                                        .map(ShiftWeight::getWeight)
                                        .findFirst().orElse(1);
                                user.setScore(user.getScore() + weight);
                            }
                        }
                    }
                }
                saveShiftsAsync()
                        .onSuccess(v -> userService.saveUsersAsync().onSuccess(v2 -> promise.complete()).onFailure(promise::fail))
                        .onFailure(promise::fail);
            }).onFailure(promise::fail);
        }).onFailure(promise::fail);
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
        List<AssignedShift> toRemove = new ArrayList<>();
        for (AssignedShift s : shifts) {
            if (s.equals(new Shift(date, type))) {
                toRemove.add(s);
            }
        }
        shiftWeightSettingsService.getSettings().onSuccess(settings -> {
            String currentPreset = settings.getCurrentPreset();
            var preset = settings.getPresets().get(currentPreset);
            userService.getAllUsers().onSuccess(users -> {
                for (AssignedShift shift : toRemove) {
                    if (shift.getAssignedUsername() != null) {
                        User user = users.stream()
                                .filter(u -> u.getName().equals(shift.getAssignedUsername()))
                                .findFirst().orElse(null);
                        if (user != null) {
                            int weight = preset.getWeights().stream()
                                    .filter(w -> w.getDay() == getDayOfWeek(shift.getDate()) && w.getShiftType() == shift.getType())
                                    .map(ShiftWeight::getWeight)
                                    .findFirst().orElse(1);
                            int newScore = user.getScore() - weight;
                            user.setScore(Math.max(0, newScore));
                        }
                    }
                    shifts.remove(shift);
                }
                boolean removed = toRemove.size() > 0;
                if (removed) {
                    saveShiftsAsync()
                            .onSuccess(v -> userService.saveUsersAsync().onSuccess(v2 -> promise.complete(true)).onFailure(promise::fail))
                            .onFailure(promise::fail);
                } else {
                    promise.complete(false);
                }
            }).onFailure(promise::fail);
        }).onFailure(promise::fail);
    }

    public Future<List<AssignedShift>> suggestShiftAssignment(List<Shift> shifts, Map<User, List<Constraint>> userToConstraints) {
        Promise<List<AssignedShift>> promise = Promise.promise();
        
        if (!initialized) {
            loadShiftsAsync()
                    .onSuccess(v -> {
                        initialized = true;
                        proceedWithSuggestAssignment(shifts, userToConstraints, promise);
                    })
                    .onFailure(err -> {
                        logger.error("Error loading shifts", err);
                        promise.fail(err);
                    });
        } else {
            proceedWithSuggestAssignment(shifts, userToConstraints, promise);
        }
        return promise.future();
    }

    private void proceedWithSuggestAssignment(List<Shift> shifts, Map<User, List<Constraint>> userToConstraints, Promise<List<AssignedShift>> promise) {
        // Filter out admin users from assignment
        String adminUsername = System.getenv().getOrDefault("ADMIN_USERNAME", "admin");
        Map<User, List<Constraint>> nonAdminUserToConstraints = userToConstraints.entrySet().stream()
            .filter(entry -> !"admin".equals(entry.getKey().getRole()) && !adminUsername.equals(entry.getKey().getName()))
            .collect(java.util.stream.Collectors.toMap(
                java.util.Map.Entry::getKey,
                java.util.Map.Entry::getValue
            ));

        List<User> users = new ArrayList<>(nonAdminUserToConstraints.keySet());
        if (users.isEmpty()) {
            promise.complete(new ArrayList<>());
            return;
        }

        Vertx vertx = Vertx.currentContext().owner();
        shiftWeightSettingsService.getSettings().onSuccess(settings -> {
            // Fast greedy assignment first
            String currentPreset = settings.getCurrentPreset();
            List<ShiftWeight> shiftsWeight = settings.getPresets().get(currentPreset).getWeights();
            List<Shift> shiftsToAssign = new ArrayList<>(shifts);
            shiftsWeight.sort((a, b) -> Integer.compare(b.getWeight(), a.getWeight()));
            // Sort shifts by weight (descending)
            List<Shift> sortedShifts = new ArrayList<>();
            for (ShiftWeight sw : shiftsWeight) {
                Optional<Shift> match = findMatchingShift(sw, shiftsToAssign);
                match.ifPresent(sortedShifts::add);
            }
            // Remove duplicates
            Set<String> seen = new HashSet<>();
            List<Shift> uniqueShifts = new ArrayList<>();
            for (Shift s : sortedShifts) {
                String key = s.getDate().getTime() + ":" + s.getType();
                if (seen.add(key)) uniqueShifts.add(s);
            }
            // Prepare user state
            Map<String, List<Shift>> userShifts = new HashMap<>();
            Map<String, Integer> userMissedDays = new HashMap<>();
            Map<String, Integer> userScores = new HashMap<>();
            for (User user : users) {
                userShifts.put(user.getName(), new ArrayList<>());
                userMissedDays.put(user.getName(), 0);
                userScores.put(user.getName(), user.getScore());
            }
            List<AssignedShift> greedyAssignment = new ArrayList<>();
            for (Shift shift : uniqueShifts) {
                users.sort(Comparator.comparingInt(u -> userScores.getOrDefault(u.getName(), 0)));
                boolean assigned = false;
                for (User user : users) {
                    String userId = user.getName();
                    List<Constraint> constraints = nonAdminUserToConstraints.get(user);
                    List<Shift> pastShifts = userShifts.get(userId);
                    int currentMissed = userMissedDays.get(userId);
                    int score = userScores.getOrDefault(userId, 0);
                    // CANT constraint
                    boolean blocked = constraints.stream().anyMatch(c ->
                            c.getUserId().equals(userId) &&
                                    c.getShift().getType() == shift.getType() &&
                                    isSameDay(c.getShift().getDate(), shift.getDate()) &&
                                    c.getConstraintType() == ConstraintType.CANT
                    );
                    if (blocked) continue;
                    // 48h gap
                    boolean has48hGap = pastShifts.stream().allMatch(s ->
                            Math.abs(s.getDate().getTime() - shift.getDate().getTime()) >= 48L * 60 * 60 * 1000
                    );
                    if (!has48hGap) continue;
                    // IMMEDIATE preset missed days
                    int missedDaysForShift = 0;
                    if (ShiftWeightPresetType.IMMEDIATE.getHebrewName().equals(currentPreset)) {
                        missedDaysForShift = calculateMissedDays(getDayOfWeek(shift.getDate()), shift.getType());
                        if ((currentMissed + missedDaysForShift) > 2) continue;
                    }
                    // Assign
                    pastShifts.add(shift);
                    userMissedDays.put(userId, currentMissed + missedDaysForShift);
                    int weight = settings.getPresets().get(currentPreset).getWeights().stream()
                            .filter(w -> w.getDay() == getDayOfWeek(shift.getDate()) && w.getShiftType() == shift.getType())
                            .map(ShiftWeight::getWeight)
                            .findFirst().orElse(1);
                    userScores.put(userId, score + weight);
                    greedyAssignment.add(new AssignedShift(userId, shift));
                    assigned = true;
                    break;
                }
                if (!assigned) {
                    // Could not assign this shift in greedy
                    break;
                }
            }
            if (greedyAssignment.size() == uniqueShifts.size()) {
                // All shifts assigned, return fast
                promise.complete(greedyAssignment);
                return;
            }
            // If greedy failed, use backtracking with 10s time limit
            vertx.executeBlocking(future -> {
                long startTime = System.currentTimeMillis();
                long maxMillis = 10000L; // 10 seconds
                try {
                    List<AssignedShift> bestFullAssignment = new ArrayList<>();
                    int[] bestFullScoreDiff = {Integer.MAX_VALUE};
                    List<AssignedShift> bestPartialAssignment = new ArrayList<>();
                    int[] bestPartialSize = {0};
                    // Prepare user state for backtracking
                    Map<String, List<Shift>> userShiftsBT = new HashMap<>();
                    Map<String, Integer> userMissedDaysBT = new HashMap<>();
                    Map<String, Integer> userScoresBT = new HashMap<>();
                    for (User user : users) {
                        userShiftsBT.put(user.getName(), new ArrayList<>());
                        userMissedDaysBT.put(user.getName(), 0);
                        userScoresBT.put(user.getName(), user.getScore());
                    }
                    assignShiftsBacktrackTimedFull(0, uniqueShifts, users, nonAdminUserToConstraints, userShiftsBT, userMissedDaysBT, userScoresBT, new ArrayList<>(), bestFullAssignment, bestFullScoreDiff, bestPartialAssignment, bestPartialSize, currentPreset, settings, startTime, maxMillis);
                    // Prefer full assignment if found, else partial
                    if (bestFullAssignment.size() == uniqueShifts.size()) {
                        future.complete(new ArrayList<>(bestFullAssignment));
                    } else {
                        future.complete(new ArrayList<>(bestPartialAssignment));
                    }
                } catch (Exception e) {
                    future.fail(e);
                }
            }, res -> {
                if (res.succeeded()) {
                    promise.complete((List<AssignedShift>) res.result());
                } else {
                    logger.error("Error assigning shifts (backtracking)", res.cause());
                    promise.fail(res.cause());
                }
            });
        }).onFailure(promise::fail);
    }

    private void assignShiftsBacktrackTimedFull(int idx, List<Shift> shifts, List<User> users, Map<User, List<Constraint>> userToConstraints,
                                            Map<String, List<Shift>> userShifts, Map<String, Integer> userMissedDays, Map<String, Integer> userScores,
                                            List<AssignedShift> currentAssignment, List<AssignedShift> bestFullAssignment, int[] bestFullScoreDiff,
                                            List<AssignedShift> bestPartialAssignment, int[] bestPartialSize,
                                            String currentPreset, ShiftWeightSettings settings, long startTime, long maxMillis) {
        if (System.currentTimeMillis() - startTime > maxMillis) return;
        if (idx == shifts.size()) {
            // Full assignment
            int maxScore = userScores.values().stream().max(Integer::compareTo).orElse(0);
            int minScore = userScores.values().stream().min(Integer::compareTo).orElse(0);
            int scoreDiff = maxScore - minScore;
            if (scoreDiff < bestFullScoreDiff[0]) {
                bestFullScoreDiff[0] = scoreDiff;
                bestFullAssignment.clear();
                bestFullAssignment.addAll(currentAssignment);
            }
            // Also update best partial (should be same as full here)
            if (currentAssignment.size() > bestPartialSize[0]) {
                bestPartialSize[0] = currentAssignment.size();
                bestPartialAssignment.clear();
                bestPartialAssignment.addAll(currentAssignment);
            }
            return;
        }
        Shift shift = shifts.get(idx);
        boolean assigned = false;
        for (User user : users) {
            String userId = user.getName();
            List<Constraint> constraints = userToConstraints.get(user);
            List<Shift> pastShifts = userShifts.get(userId);
            int currentMissed = userMissedDays.get(userId);
            int score = userScores.get(userId);
            boolean blocked = constraints.stream().anyMatch(c ->
                    c.getUserId().equals(userId) &&
                            c.getShift().getType() == shift.getType() &&
                            isSameDay(c.getShift().getDate(), shift.getDate()) &&
                            c.getConstraintType() == ConstraintType.CANT
            );
            if (blocked) continue;
            boolean has48hGap = pastShifts.stream().allMatch(s ->
                    Math.abs(s.getDate().getTime() - shift.getDate().getTime()) >= 48L * 60 * 60 * 1000
            );
            if (!has48hGap) continue;
            int missedDaysForShift = 0;
            if (ShiftWeightPresetType.IMMEDIATE.getHebrewName().equals(currentPreset)) {
                missedDaysForShift = calculateMissedDays(getDayOfWeek(shift.getDate()), shift.getType());
                if ((currentMissed + missedDaysForShift) > 2) continue;
            }
            pastShifts.add(shift);
            userMissedDays.put(userId, currentMissed + missedDaysForShift);
            int weight = settings.getPresets().get(currentPreset).getWeights().stream()
                    .filter(w -> w.getDay() == getDayOfWeek(shift.getDate()) && w.getShiftType() == shift.getType())
                    .map(ShiftWeight::getWeight)
                    .findFirst().orElse(1);
            userScores.put(userId, score + weight);
            currentAssignment.add(new AssignedShift(userId, shift));
            assignShiftsBacktrackTimedFull(idx + 1, shifts, users, userToConstraints, userShifts, userMissedDays, userScores, currentAssignment, bestFullAssignment, bestFullScoreDiff, bestPartialAssignment, bestPartialSize, currentPreset, settings, startTime, maxMillis);
            pastShifts.remove(pastShifts.size() - 1);
            userMissedDays.put(userId, currentMissed);
            userScores.put(userId, score);
            currentAssignment.remove(currentAssignment.size() - 1);
            assigned = true;
        }
        if (!assigned) {
            // Could not assign this shift, update best partial
            if (currentAssignment.size() > bestPartialSize[0]) {
                bestPartialSize[0] = currentAssignment.size();
                bestPartialAssignment.clear();
                bestPartialAssignment.addAll(currentAssignment);
            }
            // Continue to next shift (skip this one)
            assignShiftsBacktrackTimedFull(idx + 1, shifts, users, userToConstraints, userShifts, userMissedDays, userScores, currentAssignment, bestFullAssignment, bestFullScoreDiff, bestPartialAssignment, bestPartialSize, currentPreset, settings, startTime, maxMillis);
        }
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

    // Helper to get Day enum from Date
    private Day getDayOfWeek(Date date) {
        Calendar cal = Calendar.getInstance();
        cal.setTime(date);
        int dayOfWeek = cal.get(Calendar.DAY_OF_WEEK);
        switch (dayOfWeek) {
            case Calendar.SUNDAY:
                return Day.SUNDAY;
            case Calendar.MONDAY:
                return Day.MONDAY;
            case Calendar.TUESDAY:
                return Day.TUESDAY;
            case Calendar.WEDNESDAY:
                return Day.WEDNESDAY;
            case Calendar.THURSDAY:
                return Day.THURSDAY;
            case Calendar.FRIDAY:
                return Day.FRIDAY;
            case Calendar.SATURDAY:
                return Day.SATURDAY;
            default:
                throw new IllegalArgumentException("Invalid day of week: " + dayOfWeek);
        }
    }

    /**
     * Deletes all shifts for the specified week (Sunday–Saturday), updates user scores.
     * @param weekStart start date of the week (Sunday)
     * @return Future<Integer> number of deleted shifts
     */
    public Future<Integer> deleteShiftsForWeek(Date weekStart) {
        Promise<Integer> promise = Promise.promise();
        Calendar start = Calendar.getInstance();
        start.setTime(weekStart);
        start.set(Calendar.HOUR_OF_DAY, 0);
        start.set(Calendar.MINUTE, 0);
        start.set(Calendar.SECOND, 0);
        start.set(Calendar.MILLISECOND, 0);
        Calendar end = (Calendar) start.clone();
        end.add(Calendar.DAY_OF_MONTH, 6);
        end.set(Calendar.HOUR_OF_DAY, 23);
        end.set(Calendar.MINUTE, 59);
        end.set(Calendar.SECOND, 59);
        end.set(Calendar.MILLISECOND, 999);
        Date weekEnd = end.getTime();

        if (!initialized) {
            loadShiftsAsync()
                .onSuccess(v -> {
                    initialized = true;
                    proceedWithDeleteShiftsForWeek(weekStart, weekEnd, promise);
                })
                .onFailure(promise::fail);
        } else {
            proceedWithDeleteShiftsForWeek(weekStart, weekEnd, promise);
        }
        return promise.future();
    }

    private void proceedWithDeleteShiftsForWeek(Date weekStart, Date weekEnd, Promise<Integer> promise) {
        shiftWeightSettingsService.getSettings().onSuccess(settings -> {
            String currentPreset = settings.getCurrentPreset();
            var preset = settings.getPresets().get(currentPreset);
            userService.getAllUsers().onSuccess(users -> {
                Map<String, User> userMap = new HashMap<>();
                for (User u : users) userMap.put(u.getName(), u);
                int initialSize = shifts.size();
                List<AssignedShift> toRemove = new ArrayList<>();
                for (AssignedShift s : new ArrayList<>(shifts)) {
                    Date d = s.getDate();
                    if (d != null && !d.before(weekStart) && !d.after(weekEnd)) {
                        // Update user score if assigned
                        if (s.getAssignedUsername() != null) {
                            User user = userMap.get(s.getAssignedUsername());
                            if (user != null) {
                                int weight = preset.getWeights().stream()
                                        .filter(w -> w.getDay() == getDayOfWeek(s.getDate()) && w.getShiftType() == s.getType())
                                        .map(ShiftWeight::getWeight)
                                        .findFirst().orElse(1);
                                int newScore = user.getScore() - weight;
                                user.setScore(Math.max(0, newScore));
                            }
                        }
                        toRemove.add(s);
                    }
                }
                for (AssignedShift s : toRemove) {
                    shifts.remove(s);
                }
                int deleted = toRemove.size();
                saveShiftsAsync()
                    .onSuccess(v -> userService.saveUsersAsync().onSuccess(v2 -> promise.complete(deleted)).onFailure(promise::fail))
                    .onFailure(promise::fail);
            }).onFailure(promise::fail);
        }).onFailure(promise::fail);
    }
}
