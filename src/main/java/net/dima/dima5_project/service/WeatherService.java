package net.dima.dima5_project.service;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import lombok.RequiredArgsConstructor;
import net.dima.dima5_project.dto.WeatherDTO;

@Service
@RequiredArgsConstructor
public class WeatherService {

    private final RestTemplate restTemplate = new RestTemplate();
    private final String apiKey = "29b693ca66574e538caf98ecfb2d4722";

    private final PortInfoService portInfoService; // 위경도 조회용

    public WeatherDTO getWeatherByPortId(String portId) {
        // portId로 위경도 조회
        double lat = portInfoService.getLatitudeByPortId(portId);
        double lon = portInfoService.getLongitudeByPortId(portId);

        return getWeatherByCoords(lat, lon); // 기존 방식 그대로 사용
    }

    public WeatherDTO getWeatherByCoords(double lat, double lon) {
        String url = "https://api.openweathermap.org/data/2.5/weather?lat=" + lat + "&lon=" + lon +
                "&units=metric&appid=" + apiKey + "&lang=kr";

        try {
            ResponseEntity<Map> response = restTemplate.getForEntity(url, Map.class);
            Map<String, Object> body = response.getBody();

            String mainWeather = ((Map<String, Object>) ((List<?>) body.get("weather")).get(0)).get("main").toString();
            double temp = Double.parseDouble(((Map<String, Object>) body.get("main")).get("temp").toString());

            // 여기부터 바람 관련 추가
            double windSpeed = Double.parseDouble(((Map<String, Object>) body.get("wind")).get("speed").toString());
            int windDeg = ((Number) ((Map<String, Object>) body.get("wind")).get("deg")).intValue();
            String windDirLabel = mapWindDegToLabel(windDeg);

            String emoji = mapWeatherToEmoji(mainWeather);

            return WeatherDTO.builder()
                    .mainWeather(mainWeather)
                    .temperature(temp)
                    .weatherEmoji(emoji)
                    .windSpeed(windSpeed)
                    .windDeg(windDeg)
                    .windDirLabel(windDirLabel)
                    .build();

        } catch (Exception e) {
            return WeatherDTO.builder()
                    .mainWeather("Unknown")
                    .temperature(0)
                    .weatherEmoji(" ? ")
                    .windSpeed(0)
                    .windDeg(0)
                    .windDirLabel("정보 없음")
                    .build();
        }
    }

    private String mapWeatherToEmoji(String mainWeather) {
        return switch (mainWeather) {
            case "Clear" -> "☀️";
            case "Clouds" -> "☁️";
            case "Rain" -> "🌧️";
            case "Snow" -> "❄️";
            default -> "🌫️";
        };
    }

    private String mapWindDegToLabel(int deg) {
        if (deg >= 337.5 || deg < 22.5)
            return "북풍";
        else if (deg >= 22.5 && deg < 67.5)
            return "북동풍";
        else if (deg >= 67.5 && deg < 112.5)
            return "동풍";
        else if (deg >= 112.5 && deg < 157.5)
            return "남동풍";
        else if (deg >= 157.5 && deg < 202.5)
            return "남풍";
        else if (deg >= 202.5 && deg < 247.5)
            return "남서풍";
        else if (deg >= 247.5 && deg < 292.5)
            return "서풍";
        else
            return "북서풍";
    }
}
