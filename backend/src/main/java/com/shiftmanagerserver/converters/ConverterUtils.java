package com.shiftmanagerserver.converters;

import com.shiftmanagerserver.dto.Preference;
import com.shiftmanagerserver.dto.ShiftDTO;
import com.shiftmanagerserver.dto.ShiftPreferenceDTO;
import com.shiftmanagerserver.dto.UserDTO;
import com.shiftmanagerserver.entities.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

public class ConverterUtils {

    private ConverterUtils() {
    }

    public static ShiftPreferenceDTO convert(Constraint constraint) {
        return new ShiftPreferenceDTO(
                constraint.getShift().uuid(),
                convert(constraint.getConstraintType()),
                getShiftStartTime(constraint.getShift()),
                getShiftStartTime(constraint.getShift()));
    }

    public static UserDTO convert(User user, Set<Constraint> constraints) {
        Set<ShiftPreferenceDTO> preferences = constraints.stream()
                .map(ConverterUtils::convert)
                .collect(Collectors.toSet());
        return new UserDTO(UUID.fromString(user.getName()),
                preferences);
    }

    public static ShiftDTO convert(Shift shift) {
        return new ShiftDTO(shift.uuid(),
                getShiftStartTime(shift),
                getShiftEndTime(shift)
        );
    }

    public static Preference convert(ConstraintType constraintType) {
        return switch (constraintType) {
            case CANT -> Preference.CANNOT;
            case PREFERS_NOT -> Preference.PREFER_NOT;
            case PREFERS -> Preference.PREFER;
        };
    }

    private static OffsetDateTime getShiftStartTime(Shift shift) {
        return OffsetDateTime.of(
                LocalDate.ofInstant(shift.getDate().toInstant(), ZoneOffset.ofHours(3)),
                LocalTime.of(shift.getType().equals(ShiftType.DAY) ? 8 : 20, shift.getType().equals(ShiftType.DAY) ? 45 : 0),
                ZoneOffset.ofHours(3));
    }

    private static OffsetDateTime getShiftEndTime(Shift shift) {
        return OffsetDateTime.of(
                LocalDate.ofInstant(shift.getDate().toInstant(), ZoneOffset.ofHours(3)),
                LocalTime.of(shift.getType().equals(ShiftType.DAY) ? 20 : 8, shift.getType().equals(ShiftType.DAY) ? 0 : 45),
                ZoneOffset.ofHours(3));
    }
}
