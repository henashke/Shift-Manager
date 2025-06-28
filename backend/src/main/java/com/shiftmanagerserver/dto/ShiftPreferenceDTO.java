package com.shiftmanagerserver.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

public record ShiftPreferenceDTO(UUID uuid,
                                 Preference preference,
                                 OffsetDateTime startTime,
                                 OffsetDateTime endTime) {
}