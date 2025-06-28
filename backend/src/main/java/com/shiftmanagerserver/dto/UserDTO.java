package com.shiftmanagerserver.dto;

import java.util.Set;
import java.util.UUID;

public record UserDTO(UUID userId, Set<ShiftPreferenceDTO> preferences) {
}