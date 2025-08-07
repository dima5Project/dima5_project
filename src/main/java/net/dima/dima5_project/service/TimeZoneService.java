package net.dima.dima5_project.service;

import java.time.ZoneId;
import java.time.ZoneOffset;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;

import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;
import net.dima.dima5_project.repository.PortNameRepository;

// 시차 관련 Service
@Service
@RequiredArgsConstructor
public class TimeZoneService {

    private final PortNameRepository portNameRepository;

    // portId로 DB에서 국가명을 꺼내오고 → 국가명으로 ZoneId를 찾아오는 과정
    public String getCurrentTimeByCountry(String portId) {
        // 1. portId로 PortNameEntity 조회
        String country = portNameRepository.findById(portId)
                .orElseThrow(() -> new RuntimeException("국가 정보 없음"))
                .getCountryNameEn();

        // 2. 국가명 기반 타임존 매핑
        String timezoneId = switch (country) {
            case "South Korea" -> "Asia/Seoul";
            case "Japan" -> "Asia/Tokyo";
            case "China" -> "Asia/Shanghai";
            case "Vietnam" -> "Asia/Ho_Chi_Minh";
            case "Russia" -> "Europe/Moscow";
            case "Philippines" -> "Asia/Manila";
            case "Taiwan" -> "Asia/Taipei";
            default -> "UTC"; // 기본값
        };

        // 3. 현재 시각 반환
        try {
            ZonedDateTime nowUtc = ZonedDateTime.now(ZoneOffset.UTC);
            ZonedDateTime local = nowUtc.withZoneSameInstant(ZoneId.of(timezoneId));
            return local.format(DateTimeFormatter.ofPattern("HH:mm:ss"));
        } catch (Exception e) {
            return "알 수 없음";
        }
    }
}
