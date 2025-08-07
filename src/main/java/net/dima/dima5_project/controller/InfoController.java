package net.dima.dima5_project.controller;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;
import net.dima.dima5_project.dto.HolidayDTO;
import net.dima.dima5_project.dto.PortDockingDTO;
import net.dima.dima5_project.dto.PortInfoDTO;
import net.dima.dima5_project.dto.PortInfoResponseDTO;
import net.dima.dima5_project.dto.PortNameDTO;
import net.dima.dima5_project.dto.TimeZoneDTO;
import net.dima.dima5_project.dto.WeatherDTO;
import net.dima.dima5_project.service.HolidayService;
import net.dima.dima5_project.service.PortDokingService;
import net.dima.dima5_project.service.PortInfoService;
import net.dima.dima5_project.service.TimeZoneService;
import net.dima.dima5_project.service.WeatherService;

import java.util.List;

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
    private final HolidayService holidayService;

    // InfoController.java
    @GetMapping("/all")
    public List<PortInfoResponseDTO> getAllPortInfo() {
        return portInfoService.getAllPortsInfoWithoutWeather(); // 여기가 List<PortInfoResponseDTO>
    }

    // 1. 국가명 리스트 반환
    @GetMapping("/countries")
    public List<String> getAllCountries() {
        return portInfoService.getAllCountryNames(); // 새로운 메서드 만들기
    }

    // 1 - 1. 항구 리스트 (국가 기준) / 선택 국가의 항구 정보
    @GetMapping("/country/{country}")
    public List<PortNameDTO> getPortsByCountry(@PathVariable String country) {
        return portInfoService.getPortsByCountry(country);
    }

    // 2. 날씨 정보 (항구 기준)
    @GetMapping("/weather/{portId}")
    public WeatherDTO getWeather(@PathVariable String portId) {
        double lat = portInfoService.getLatitudeByPortId(portId);
        double lon = portInfoService.getLongitudeByPortId(portId);
        return weatherService.getWeatherByCoords(lat, lon); // 위경도 직접 전달
    }

    // 3 . 시차 정보 (국가 기준)
    @GetMapping("/timezone/{country}")
    public TimeZoneDTO getTimezone(@PathVariable String country) {
        return timeZoneService.getTimezone(country);
    }

    // 4. 항만 혼잡도 (항구 기준)
    @GetMapping("/docking/{portId}")
    public PortDockingDTO getDockingInfo(@PathVariable String portId) {
        return portDokingService.getLatestDockingInfo(portId);
    }

    // 6. 공휴일 정보 (국가 기준)
    @GetMapping("/holiday/{country}")
    public HolidayDTO getHoliday(@PathVariable String country) {
        return holidayService.getTodayHolidayByCountry(country);
    }
}