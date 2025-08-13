package net.dima.dima5_project.dto;

import lombok.Data;

@Data
public class PortHoverDTO {
    // 기본 메타 (표시는 한글, 식별은 ID)
    private String portId;
    private String countryNameKr;
    private String portNameKr;
    private double lat;
    private double lon;

    // 날씨(이미 세부 필드 다 있음: temp, windSpeed, windDeg, windDirLabel, emoji 등)
    private WeatherDTO weather;

    // 혼잡도(정박/입항 수 + 등급)
    private PortDockingDTO docking;

    // 시차(국가명, 현재시각, 요일, UTC 오프셋)
    private TimeZoneDTO timezone;

    // 선택: 오늘 공휴일(툴팁에 표시하고 싶다면)
    private HolidayDTO todayHoliday; // null 가능
}