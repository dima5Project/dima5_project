package net.dima.dima5_project.service;

import java.time.ZoneId;
import java.time.ZoneOffset;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;

import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;
import net.dima.dima5_project.dto.TimeZoneDTO;
import net.dima.dima5_project.repository.PortNameRepository;

// 시차 관련 Service
@Service
@RequiredArgsConstructor
public class TimeZoneService {

    // 국가명 기준으로 TimezoneDTO 반환
    public TimeZoneDTO getTimezone(String country) {
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

        try {
            ZonedDateTime nowUtc = ZonedDateTime.now(ZoneOffset.UTC);
            ZonedDateTime local = nowUtc.withZoneSameInstant(ZoneId.of(timezoneId));

            String currentTime = local.format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
            String offset = local.getOffset().getId(); // ex: +09:00

            return TimeZoneDTO.builder()
                    .countryName(country)
                    .timezone("UTC" + offset)
                    .currentTime(currentTime)
                    .build();

        } catch (Exception e) {
            return TimeZoneDTO.builder()
                    .countryName(country)
                    .timezone("알 수 없음")
                    .currentTime("알 수 없음")
                    .build();
        }
    }
}
