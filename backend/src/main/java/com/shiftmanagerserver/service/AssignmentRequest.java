package com.shiftmanagerserver.service;

import com.shiftmanagerserver.entities.Shift;

import java.util.Set;

public interface AssignmentRequest {

    String findAssignment(Set<Shift> shifts);
}
