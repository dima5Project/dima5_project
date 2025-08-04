package net.dima.dima5_project.service;

import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import lombok.RequiredArgsConstructor;
import net.dima.dima5_project.dto.PortInfoResponseDTO.WeatherDTO;

@Service
@RequiredArgsConstructor
public class WeatherService {
    @Value("${weather.api.url}")
    private String apiUrl;

    @Value("${weather.api.authkey}")
    private String apiKey;

    private final RestTemplate restTemplate = new RestTemplate();

    /**
     * 위도, 경도 기반으로 날씨 정보를 조회하고 항구 이름 포함한 DTO 반환
     * 
     * @param portName 항구 이름
     * @param lat      위도
     * @param lon      경도
     * @return WeatherDTO
     */
    public WeatherDTO getWeatherInfo(String portName, double lat, double lon) {
        String url = String.format(
                "%s?lat=%.6f&lon=%.6f&units=metric&lang=kr&appid=%s",
                apiUrl, lat, lon, apiKey);

        try {
            String response = restTemplate.getForObject(url, String.class);
            JSONObject obj = new JSONObject(response);

            double temp = obj.getJSONObject("main").getDouble("temp");
            String icon = obj.getJSONArray("weather").getJSONObject(0).getString("icon");

            return new WeatherDTO(portName, String.format("%.1f°C", temp), icon);

        } catch (Exception e) {
            e.printStackTrace();
            // 실패 시 기본값 반환
            return new WeatherDTO(portName, "-", "01d");
        }
    }
}
