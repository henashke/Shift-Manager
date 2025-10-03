package com.shiftmanagerserver.handlers;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.inject.Inject;
import com.shiftmanagerserver.dao.RedisShiftWeightSettingsDao;
import com.shiftmanagerserver.dao.RedisUserDao;
import com.shiftmanagerserver.dao.RedisShiftsDao;
import com.shiftmanagerserver.dao.RedisConstraintDao;
import io.vertx.core.CompositeFuture;
import io.vertx.core.Future;
import io.vertx.core.buffer.Buffer;
import io.vertx.ext.web.Router;
import io.vertx.ext.web.RoutingContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

public class BackupHandler implements Handler {
    private static final Logger logger = LoggerFactory.getLogger(BackupHandler.class);
    private final RedisUserDao userDao;
    private final RedisShiftsDao shiftsDao;
    private final RedisConstraintDao constraintDao;
    private final RedisShiftWeightSettingsDao shiftWeightSettingsDao;
    private final ObjectMapper objectMapper;

    @Inject
    public BackupHandler(RedisUserDao userDao, RedisShiftsDao shiftsDao, RedisConstraintDao constraintDao, RedisShiftWeightSettingsDao shiftWeightSettingsDao, ObjectMapper objectMapper) {
        this.userDao = userDao;
        this.shiftsDao = shiftsDao;
        this.constraintDao = constraintDao;
        this.shiftWeightSettingsDao = shiftWeightSettingsDao;
        this.objectMapper = objectMapper;
    }

    @Override
    public void addRoutes(Router router) {
        router.get("/api/backup").handler(this::handleBackup);
    }

    private void handleBackup(RoutingContext ctx) {
        CompositeFuture compositeFuture = Future.all(List.of(userDao.read(), shiftsDao.read(), constraintDao.read(), shiftWeightSettingsDao.read()));
        compositeFuture.onSuccess(compositeFuture1 -> {
            try {
                ByteArrayOutputStream baos = new ByteArrayOutputStream();
                ZipOutputStream zos = new ZipOutputStream(baos);

                // Users
                Object users = compositeFuture1.resultAt(0);
                String usersJson = objectMapper.writeValueAsString(users);
                zos.putNextEntry(new ZipEntry("users.json"));
                zos.write(usersJson.getBytes());
                zos.closeEntry();

                // Shifts
                Object shifts = compositeFuture1.resultAt(1);
                String shiftsJson = objectMapper.writeValueAsString(shifts);
                zos.putNextEntry(new ZipEntry("shifts.json"));
                zos.write(shiftsJson.getBytes());
                zos.closeEntry();

                // Constraints
                Object constraints = compositeFuture1.resultAt(2);
                String constraintsJson = objectMapper.writeValueAsString(constraints);
                zos.putNextEntry(new ZipEntry("constraints.json"));
                zos.write(constraintsJson.getBytes());
                zos.closeEntry();

                // Shift Weight Settings
                Object shiftWeightSettings = compositeFuture1.resultAt(3);
                String shiftWeightSettingsJson = objectMapper.writeValueAsString(shiftWeightSettings);
                zos.putNextEntry(new ZipEntry("shiftWeightSettings.json"));
                zos.write(shiftWeightSettingsJson.getBytes());
                zos.closeEntry();

                zos.close();

                // Add date and time to filename
                LocalDateTime now = LocalDateTime.now();
                DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd_HH-mm-ss");
                String timestamp = now.format(formatter);
                String filename = "backup-" + timestamp + ".zip";

                ctx.response()
                    .putHeader("Content-Type", "application/zip")
                    .putHeader("Content-Disposition", "attachment; filename=" + filename)
                    .end(Buffer.buffer(baos.toByteArray()));
            } catch (IOException e) {
                logger.error("Error creating backup zip", e);
                ctx.response().setStatusCode(500).end();
            }
        }).onFailure(error -> {
            logger.error("Error reading data for backup", error);
            ctx.response().setStatusCode(500).end();
        });
    }
}
