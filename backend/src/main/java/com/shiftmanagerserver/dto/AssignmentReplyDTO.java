package com.shiftmanagerserver.dto;

import java.util.Collection;
import java.util.Map;
import java.util.UUID;

public record AssignmentReplyDTO(boolean isFullAssigned, Map<UUID, Collection<UUID>> assignment) {
}
