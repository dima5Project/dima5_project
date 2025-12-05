# ============================
# 1단계: Gradle로 JAR 빌드
# ============================
FROM gradle:8.7-jdk17 AS builder

# 컨테이너 안 작업 디렉토리
WORKDIR /app

# Gradle 설정 파일들 복사
COPY build.gradle settings.gradle gradlew gradlew.bat ./
COPY gradle ./gradle

# 소스 코드 복사
COPY src ./src

# 스프링 부트 JAR 빌드 (bootJar 실행)
RUN ./gradlew bootJar --no-daemon


# ============================
# 2단계: JAR 실행 전용 이미지
# ============================
FROM eclipse-temurin:17-jre-jammy

WORKDIR /app

# 위에서 빌드된 JAR 복사
COPY --from=builder /app/build/libs/*.jar app.jar

# 스프링 부트 기본 포트
EXPOSE 8080

# 컨테이너 시작 시 실행할 명령
ENTRYPOINT ["java","-jar","app.jar"]

# 🔹 이 줄 추가
RUN chmod +x gradlew
