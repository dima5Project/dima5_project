# 빌드 스테이지
FROM gradle:8.7-jdk17 AS builder
WORKDIR /app

# Gradle wrapper 복사
COPY build.gradle settings.gradle gradlew gradlew.bat ./

# 🔥 실행 권한 부여 — 이 줄 반드시 넣자
RUN chmod +x gradlew

# Gradle 디렉토리 복사
COPY gradle ./gradle

# 소스 코드 복사
COPY src ./src

# 스프링 부트 JAR 빌드
RUN ./gradlew bootJar --no-daemon



# ------------ 실행 스테이지 -------------
FROM eclipse-temurin:17-jre-jammy

WORKDIR /app

# builder 스테이지에서 jar 파일 복사
COPY --from=builder /app/build/libs/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
