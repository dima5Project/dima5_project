package net.dima.dima5_project.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WeatherDTO {
    private String mainWeather;
    private String weatherEmoji;
    private double temperature;
    private double windSpeed; // 바람 속도 (m/s)
    private int windDeg; // 바람 방향 (각도)
    private String windDirLabel; // 바람 방향 텍스트 (예: 북풍, 남서풍)
    // 외부 API라 Entity 없음 -> build 건너 뜀

}
