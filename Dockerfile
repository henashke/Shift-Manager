FROM node:20 as frontend-builder

WORKDIR /frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ .

# Set environment variables for production build
ENV NODE_ENV=production
ENV REACT_APP_API_BASE_URL=""

# Debug: Print environment variables
RUN echo "NODE_ENV: $NODE_ENV"
RUN echo "REACT_APP_API_BASE_URL: '$REACT_APP_API_BASE_URL'"

# Create a .env file to ensure React reads the environment variables
RUN echo "REACT_APP_API_BASE_URL=" > .env
RUN echo "NODE_ENV=production" >> .env

# Build the frontend with the correct environment variables
RUN npm run build

# Verify the build output and check for localhost references
RUN echo "=== Build verification ==="
RUN ls -la build/
RUN echo "=== Checking for localhost references ==="
RUN find build/ -name "*.js" -exec grep -l "localhost:8080" {} \; || echo "No localhost:8080 found in build files"

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