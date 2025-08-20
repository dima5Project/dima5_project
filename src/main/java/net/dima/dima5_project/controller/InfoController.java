package net.dima.dima5_project.controller;

import lombok.RequiredArgsConstructor;
import net.dima.dima5_project.dto.*;
import net.dima.dima5_project.service.*;
import net.dima.dima5_project.support.PortCoordinates;

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
    private final PortCoordinates portCoordinates;

    // 1. 혼잡도 (정박 + 입항 예정)
    @GetMapping("/docking/{portId}")
    public PortDockingDTO getDocking(@PathVariable("portId") String portId) {
        return portDockingService.getLatestDockingInfo(portId);
    }

    // 1-1. 현진 추가(1번)
    @GetMapping("/docking/all")
    public List<PortCongestionSummary> getAllDocking() {
        return portDockingService.getAllPortCongestions();
    }

    // 2. 날씨 (위경도 직접 받기)
    @GetMapping("/weather/direct")
    public WeatherDTO getWeatherByCoords(@RequestParam("lat") double lat,
            @RequestParam("lon") double lon) {
        return weatherService.getWeatherByCoords(lat, lon);
    }

    // 3. 시차
    @GetMapping("/timezone/{country}")
    public TimeZoneDTO getTimezone(@PathVariable("country") String country) {
        return timeZoneService.getTimezone(country);
    }

    @GetMapping("/holiday/{country}")
    public List<HolidayDTO> getHolidaysByCountry(@PathVariable("country") String country) {
        return holidayService.getAllHolidaysByCountry(country);
    }

    // 5. 그래프 데이터
    @GetMapping("/dock-graph/{portId}")
    public List<Map<String, Object>> getDockingGraph(@PathVariable("portId") String portId) {
        return portDockingService.getDockingGraphData(portId);
    }

    // 6. 전체 국가 목록
    @GetMapping("/countries")
    public List<String> getCountryList() {
        return portInfoService.getAllCountryNames();
    }

    // 7. 특정 국가의 항구 목록
    @GetMapping("/ports/{country}")
    public List<PortSimpleDTO> getPortsByCountry(@PathVariable("country") String country) {
        return portInfoService.getPortsByCountry(country)
                .stream()
                .map(p -> new PortSimpleDTO(p.getPortId(), p.getPortNameKr()))
                .toList();
    }

    @GetMapping("/port/{portId}")
    public PortNameDTO getPort(@PathVariable("portId") String portId) {
        return portInfoService.getPortById(portId);
    }

    @GetMapping("/hover/{portId}")
    public PortHoverDTO getHover(@PathVariable("portId") String portId) {
        PortNameDTO base = portInfoService.getPortById(portId);
        var coord = portCoordinates.getByKoName(base.getPortNameKr());
        if (coord == null)
            throw new IllegalArgumentException("좌표 없음: " + base.getPortNameKr());

        var docking = portDockingService.getLatestDockingInfo(portId);
        var timezone = timeZoneService.getTimezone(base.getCountryNameKr());
        var weather = weatherService.getWeatherByCoords(coord.lat(), coord.lon());
        var holiday = holidayService.getTodayHolidayByCountry(base.getCountryNameKr());

        PortHoverDTO dto = new PortHoverDTO();
        dto.setPortId(portId);
        dto.setCountryNameKr(base.getCountryNameKr());
        dto.setPortNameKr(base.getPortNameKr());
        dto.setLat(coord.lat());
        dto.setLon(coord.lon());
        dto.setWeather(weather);
        dto.setDocking(docking);
        dto.setTimezone(timezone);
        dto.setTodayHoliday(holiday);
        return dto;
    }

    // ⬇️ InfoController.java 맨 아래에 추가
    @GetMapping("/weather/emoji/{portId}")
    public Map<String, Object> getWeatherEmojiByPort(@PathVariable String portId) {
        PortNameDTO base = portInfoService.getPortById(portId);
        if (base == null) {
            throw new IllegalArgumentException("존재하지 않는 포트ID: " + portId);
        }
        var coord = portCoordinates.getByKoName(base.getPortNameKr());
        if (coord == null) {
            throw new IllegalArgumentException("좌표 없음: " + base.getPortNameKr());
        }
        WeatherDTO w = weatherService.getWeatherByCoords(coord.lat(), coord.lon());
        return Map.of(
                "emoji", w.getWeatherEmoji(),
                "lat", coord.lat(),
                "lon", coord.lon());
    }
}
