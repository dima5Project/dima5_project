package net.dima.dima5_project.service;

import java.time.ZoneId;
import java.time.ZoneOffset;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.TextStyle;
import java.util.Locale;
import java.util.Map;

import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;
import net.dima.dima5_project.dto.TimeZoneDTO;
import net.dima.dima5_project.repository.PortNameRepository;

// 시차 관련 Service
@Service
@RequiredArgsConstructor
public class TimeZoneService {

    // 국가명 기준으로 TimezoneDTO 반환
    private static final Map<String, String> TIMEZONES = Map.of(
            "한국", "Asia/Seoul",
            "일본", "Asia/Tokyo",
            "중국", "Asia/Shanghai",
            "홍콩", "Asia/Hong_Kong",
            "대만", "Asia/Taipei",
            "러시아", "Asia/Vladivostok",
            "필리핀", "Asia/Manila",
            "베트남", "Asia/Ho_Chi_Minh");

    public TimeZoneDTO getTimezone(String countryName) {
        String zoneId = TIMEZONES.getOrDefault(countryName, "UTC");
        ZonedDateTime zoned = ZonedDateTime.now(ZoneId.of(zoneId));

        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd hh:mm a");
        String currentTime = zoned.format(formatter);
        String utcOffset = zoned.getOffset().toString(); // +09:00
        String dayOfWeek = zoned.getDayOfWeek().getDisplayName(TextStyle.FULL, Locale.KOREAN); // 요일 -> 기준 국가 바꿀수 잇음...?

        return TimeZoneDTO.builder()
                .countryName(countryName)
                .currentTime(currentTime)
                .utcOffset(utcOffset)
                .dayOfWeek(dayOfWeek)
                .build();
    }
}
