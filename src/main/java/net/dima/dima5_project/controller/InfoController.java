package net.dima.dima5_project.controller;

import lombok.RequiredArgsConstructor;
import net.dima.dima5_project.dto.*;
import net.dima.dima5_project.entity.PortNameEntity;
import net.dima.dima5_project.service.*;

import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/info")
@RequiredArgsConstructor
public class InfoController {

    private final WeatherService weatherService;
    private final TimeZoneService timeZoneService;
    private final PortDockingService portDockingService;
    private final HolidayService holidayService;
    private final PortInfoService portInfoService;

    // 1. 혼잡도 (정박 + 입항 예정)
    @GetMapping("/docking/{portId}")
    public PortDockingDTO getDocking(@PathVariable String portId) {
        return portDockingService.getLatestDockingInfo(portId);
    }

    // 2. 날씨 (위경도 직접 받기)
    @GetMapping("/weather/direct")
    public WeatherDTO getWeatherByCoords(@RequestParam double lat, @RequestParam double lon) {
        return weatherService.getWeatherByCoords(lat, lon);
    }

    // 3. 시차
    @GetMapping("/timezone/{country}")
    public TimeZoneDTO getTimezone(@PathVariable String country) {
        return timeZoneService.getTimezone(country);
    }

    @GetMapping("/holiday/{country}")
    public List<HolidayDTO> getHolidaysByCountry(@PathVariable String country) {
        return holidayService.getAllHolidaysByCountry(country);
    }

    // 5. 그래프 데이터 (DTO 없이 Map으로 반환)
    @GetMapping("/dock-graph/{portId}")
    public List<Map<String, Object>> getDockingGraph(@PathVariable String portId) {
        return portDockingService.getDockingGraphData(portId);
    }

    // 6. 전체 국가 목록
    @GetMapping("/countries")
    public List<String> getCountryList() {
        return portInfoService.getAllCountryNames();
    }

    // 7. 특정 국가의 항구 목록
    @GetMapping("/ports/{country}")
    public List<PortNameEntity> getPortsByCountry(@PathVariable String country) {
        return portInfoService.getPortsByCountry(country);
    }

}
