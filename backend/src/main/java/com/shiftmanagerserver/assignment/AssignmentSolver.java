package com.shiftmanagerserver.assignment;

import com.google.inject.Inject;
import com.google.inject.name.Named;
import com.shiftmanagerserver.dto.AssignmentReplyDTO;
import com.shiftmanagerserver.dto.AssignmentRequestDTO;
import com.shiftmanagerserver.entities.Shift;
import com.shiftmanagerserver.service.UserService;
import io.vertx.core.Vertx;
import io.vertx.core.buffer.Buffer;
import io.vertx.core.impl.logging.Logger;
import io.vertx.core.impl.logging.LoggerFactory;
import io.vertx.core.json.JsonObject;
import io.vertx.ext.web.client.HttpResponse;
import io.vertx.ext.web.client.WebClient;

import java.util.Set;

/**
 * Handles the assignment of shifts to users by communicating with the assignment service.
 */
public class AssignmentSolver {
    private static final Logger logger = LoggerFactory.getLogger(AssignmentSolver.class);
    private final WebClient client;
    private final UserService userService;
    private final String assignmentServiceUrl;
    private final String assignmentServiceIp;
    private final Integer assignmentServicePort;

    @Inject
    public AssignmentSolver(Vertx vertx, WebClient client, UserService userService,
                            @Named("solver.url") String assignmentServiceUrl,
                            @Named("solver.ip") String assignmentServiceIp,
                            @Named("solver.port") String assignmentServicePort) {
        this.client = WebClient.create(vertx);
        this.userService = userService;
        this.assignmentServiceUrl = assignmentServiceUrl;
        this.assignmentServiceIp = assignmentServiceIp;
        this.assignmentServicePort = Integer.valueOf(assignmentServicePort);
    }

    public void solveAssignment(Set<Shift> shifts) {
        client.post(assignmentServicePort, assignmentServiceIp, assignmentServiceUrl)
                .putHeader("Content-Type", "application/json")
                .sendJsonObject(JsonObject.mapFrom(buildAssignmentRequestDTO(shifts)), ar -> {
                    if (ar.succeeded()) {
                        handleResponse(ar.result());
                    } else {
                        logger.error("Request failed: " + ar.cause().getMessage());
                    }
                });
    }

    public AssignmentRequestDTO buildAssignmentRequestDTO(Set<Shift> shifts) {
//        return new AssignmentRequestDTO(userService.users().result().stream()
//                .map(ConverterUtils::convert)
//                .collect(Collectors.toSet()),
//                shifts.stream()
//                        .map(ConverterUtils::convert)
//                        .collect(Collectors.toSet())
//        );
        return null;
    }

    void handleResponse(HttpResponse<Buffer> response) {
        if (response.statusCode() == 200) {
            AssignmentReplyDTO reply = response.bodyAsJsonObject().mapTo(AssignmentReplyDTO.class);
        } else {
            logger.error("Request failed: " + response.statusCode());
        }
    }
}

