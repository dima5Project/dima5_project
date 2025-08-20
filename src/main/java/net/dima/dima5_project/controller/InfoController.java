package net.dima.dima5_project.controller;

import lombok.RequiredArgsConstructor;
import net.dima.dima5_project.dto.*;
import net.dima.dima5_project.entity.PortNameEntity;
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
    private final PortCoordinates portCoordinates; // 좌표 레지스트리 주입

    // 1. 혼잡도 (정박 + 입항 예정)
    @GetMapping("/docking/{portId}")
    public PortDockingDTO getDocking(@PathVariable String portId) {
        return portDockingService.getLatestDockingInfo(portId);
    }

    // 1-1. 현진 추가(1번)
    @GetMapping("/docking/all")
    public List<PortCongestionSummary> getAllDocking() {
        return portDockingService.getAllPortCongestions();
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
    public List<PortSimpleDTO> getPortsByCountry(@PathVariable String country) {
        return portInfoService.getPortsByCountry(country) // 기존처럼 엔티티 목록 반환
                .stream()
                .map(p -> new PortSimpleDTO(p.getPortId(), p.getPortNameKr()))
                .toList();
    }

    @GetMapping("/port/{portId}")
    public PortNameDTO getPort(@PathVariable String portId) {
        return portInfoService.getPortById(portId); // PortInfo + PortName 조인해서 PortNameDTO 반환 (locLat/locLon 포함)
    }

    @GetMapping("/hover/{portId}")
    public PortHoverDTO getHover(@PathVariable String portId) {
        // 1) 기본 메타 (PortInfo + PortName 조합)
        PortNameDTO base = portInfoService.getPortById(portId);

        // 2) 좌표(직접 입력 레지스트리)
        var coord = portCoordinates.getByKoName(base.getPortNameKr());
        if (coord == null) {
            throw new IllegalArgumentException("좌표 없음: " + base.getPortNameKr());
        }

        // 3) 동적 데이터
        var docking = portDockingService.getLatestDockingInfo(portId); // current/expected + congestionLevel
        var timezone = timeZoneService.getTimezone(base.getCountryNameKr()); // utcOffset/currentTime/dayOfWeek
        var weather = weatherService.getWeatherByCoords(coord.lat(), coord.lon()); // temp/wind/emoji

        // (선택) 오늘 공휴일 표시를 원하면 포함
        var holiday = holidayService.getTodayHolidayByCountry(base.getCountryNameKr()); // null일 수 있음

        // 4) 조립
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
}
