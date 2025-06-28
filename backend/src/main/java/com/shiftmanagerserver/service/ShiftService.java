package com.shiftmanagerserver.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.shiftmanagerserver.entities.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.File;
import java.io.IOException;
import java.util.*;

public class ShiftService {
    private static final Logger logger = LoggerFactory.getLogger(ShiftService.class);
    private static final String SHIFTS_FILE = "shifts.json";
    private final ObjectMapper objectMapper;
    private final ShiftWeightSettingsService shiftWeightSettingsService;
    private List<AssignedShift> shifts;

    public ShiftService() {
        this.objectMapper = new ObjectMapper();
        this.shifts = new ArrayList<>();
        this.shiftWeightSettingsService = new ShiftWeightSettingsService();
        loadShifts();
    }

    private void loadShifts() {
        File file = new File(SHIFTS_FILE);
        if (file.exists()) {
            try {
                shifts = objectMapper.readValue(file, new TypeReference<>() {
                });
            } catch (IOException e) {
                logger.error("Error loading shifts from file", e);
                shifts = new ArrayList<>();
            }
        } else {
            shifts = new ArrayList<>();
        }
    }

    private void saveShifts() {
        try {
            objectMapper.writeValue(new File(SHIFTS_FILE), shifts);
        } catch (IOException e) {
            logger.error("Error saving shifts to file", e);
        }
    }

    public List<AssignedShift> getAllShifts() {
        return new ArrayList<>(shifts);
    }

    public void addShifts(List<AssignedShift> newShifts) {
        for (AssignedShift shift : newShifts) {
            shifts.removeIf(s -> s.equals(shift));
            shift.setUuid(UUID.randomUUID());
            shifts.add(shift);
        }
        saveShifts();
    }

    public boolean deleteShift(Date date, ShiftType type) {
        int initialSize = shifts.size();
        shifts.removeIf(s -> s.equals(new Shift(date, type)));
        boolean removed = shifts.size() < initialSize;
        if (removed) saveShifts();
        return removed;
    }

    public List<AssignedShift> suggestShiftAssignment(List<Shift> shifts, Map<User, List<Constraint>> userToConstraints) {
        try {

            List<User> users = new ArrayList<>(userToConstraints.keySet().stream().toList());
            ShiftWeightSettings settings = shiftWeightSettingsService.getSettings();
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
                Shift newShift = new Shift(shiftsToAssign.get(shiftIndex).getDate(), shiftsToAssign.get(shiftIndex).getType());
                shiftIndex++;

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

            return assignedShifts;


        } catch (Exception e) {
            e.printStackTrace();
            logger.error("Error assigning shifts");
        }

        return null;
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

    private boolean isSameDay(Date d1, Date d2) {
        Calendar cal1 = Calendar.getInstance();
        cal1.setTime(d1);
        Calendar cal2 = Calendar.getInstance();
        cal2.setTime(d2);
        return cal1.get(Calendar.YEAR) == cal2.get(Calendar.YEAR)
                && cal1.get(Calendar.DAY_OF_YEAR) == cal2.get(Calendar.DAY_OF_YEAR);
    }


}
