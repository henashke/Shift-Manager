package com.shiftmanagerserver.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

public record ShiftDTO(UUID uuid,
                       OffsetDateTime startTime,
                       OffsetDateTime endTime) {
}