FROM node:20 as frontend-builder

WORKDIR /frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ .
# Set environment variable for production build - empty string means same origin
ENV REACT_APP_API_BASE_URL=""
ENV NODE_ENV="production"
RUN npm run build

# === Stage 2: Build Java backend ===
FROM maven:3.9.6-eclipse-temurin-17 as backend-builder

WORKDIR /backend
COPY backend/pom.xml .
COPY backend/src ./src

# Copy frontend build output into the backend static resources
COPY --from=frontend-builder /frontend/build ./src/main/resources/static

RUN mvn clean package -DskipTests

# === Stage 3: Run the backend (with embedded frontend) ===
FROM eclipse-temurin:21

WORKDIR /app
COPY --from=backend-builder /backend/target/*.jar app.jar

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]