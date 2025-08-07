package net.dima.dima5_project.controller;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;
import net.dima.dima5_project.dto.PortDockingDTO;
import net.dima.dima5_project.dto.PortInfoDTO;
import net.dima.dima5_project.dto.PortInfoResponseDTO;
import net.dima.dima5_project.dto.PortNameDTO;
import net.dima.dima5_project.dto.WeatherDTO;
import net.dima.dima5_project.service.PortDokingService;
import net.dima.dima5_project.service.PortInfoService;
import net.dima.dima5_project.service.TimeZoneService;
import net.dima.dima5_project.service.WeatherService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@RestController
@RequestMapping("/api/info")
@RequiredArgsConstructor
public class InfoController {

    private final WeatherService weatherService;
    private final TimeZoneService timeZoneService;
    private final PortDokingService portDokingService;
    private final PortInfoService portInfoService;

    @GetMapping("/{portId}")
    public PortInfoResponseDTO getPortInfo(@PathVariable String portId) {

        // 1. 위치 + 이름 정보
        PortInfoDTO portInfoDTO = portInfoService.gePortInfo(portId);
        PortNameDTO portNameDTO = portInfoDTO.getPortNameInfo();

        // 2. 정박 정보
        PortDockingDTO portDockingDTO = portDokingService.getLatestDockingInfo(portId);

        // 3. 위경도 기반 날씨 조회
        double lat = portInfoDTO.getLocLat();
        double lon = portInfoDTO.getLocLon();
        WeatherDTO weatherDTO = weatherService.getWeatherByCoords(lat, lon);

        // 4. 시간대 조회
        String timezoneNow = timeZoneService.getCurrentTimeByCountry(portId);

        // 5. 혼잡도 계산
        int total = portDockingDTO.getShipsInPort() + portDockingDTO.getExpectedShips();
        String congestion;
        if (total >= 80)
            congestion = "혼잡";
        else if (total >= 40)
            congestion = "적당";
        else
            congestion = "여유";

        // 최종 반환
        return PortInfoResponseDTO.toDTO(
                portNameDTO,
                portDockingDTO,
                weatherDTO,
                timezoneNow,
                congestion);
    }

}
