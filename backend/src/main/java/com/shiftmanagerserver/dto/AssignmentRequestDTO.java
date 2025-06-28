package com.shiftmanagerserver.dto;

import java.util.Collection;
import java.util.Set;

public record AssignmentRequestDTO(Collection<UserDTO> userDTOS, Set<ShiftDTO> shiftsToApply) {
}
