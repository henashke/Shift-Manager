# ---------- Build Stage ----------
FROM maven:3.9-eclipse-temurin-17 AS build

WORKDIR /app

RUN mvn clean package -DskipTests

# ---------- Run Stage ----------
FROM eclipse-temurin:17-jdk


WORKDIR /app

# Copy only the final JAR from the build stage
COPY --from=build /app/target/shift-manager-server-1.0-SNAPSHOT.jar app.jar

EXPOSE 8080

# Start the app
ENTRYPOINT ["java", "-jar", "app.jar"]