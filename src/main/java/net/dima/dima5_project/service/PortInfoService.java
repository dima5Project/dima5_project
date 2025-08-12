package net.dima.dima5_project.service;

import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;
import net.dima.dima5_project.dto.HolidayDTO;
import net.dima.dima5_project.dto.PortInfoDTO;
import net.dima.dima5_project.dto.PortInfoResponseDTO;
import net.dima.dima5_project.dto.PortNameDTO;
import net.dima.dima5_project.entity.PortInfoEntity;
import net.dima.dima5_project.entity.PortNameEntity;
import net.dima.dima5_project.repository.PortInfoRepository;
import net.dima.dima5_project.repository.PortNameRepository;

@Service
@RequiredArgsConstructor
public class PortInfoService {

        private final PortNameRepository portNameRepository;
        private final PortInfoRepository portInfoRepository;
        private final PortDockingService portDokingService;
        private final TimeZoneService timezoneService;
        private final HolidayService holidayService;

        public PortInfoDTO getPortInfo(String portId) {
                PortInfoEntity info = portInfoRepository.findById(portId)
                                .orElseThrow(() -> new RuntimeException("항구 위치 정보 없음"));
                PortNameEntity name = portNameRepository.findById(portId)
                                .orElseThrow(() -> new RuntimeException("항구 이름 정보 없음"));

                HolidayDTO holidayDTO = holidayService.getTodayHolidayByCountry(name.getCountryNameEn());

                return PortInfoDTO.builder()
                                .portId(info.getPortId())
                                .locLat(info.getLocLat())
                                .locLon(info.getLocLon())
                                .portNameInfo(PortNameDTO.toDTO(name))
                                .holidayInfo(holidayDTO)
                                .build();
        }

        public double getLatitudeByPortId(String portId) {
                return portInfoRepository.findById(portId)
                                .orElseThrow(() -> new RuntimeException("항구 위치 정보 없음"))
                                .getLocLat();
        }

        public double getLongitudeByPortId(String portId) {
                return portInfoRepository.findById(portId)
                                .orElseThrow(() -> new RuntimeException("항구 위치 정보 없음"))
                                .getLocLon();
        }

        public List<String> getAllCountryNames() {
                return portNameRepository.findDistinctCountryNames();
        }

        public List<PortNameEntity> getPortsByCountry(String countryNameKr) {
                return portNameRepository.findByCountryNameKr(countryNameKr);
        }

        // 주요 메서드: 날씨 제외한 항구 부가정보 전부 반환
        public List<PortInfoResponseDTO> getAllPortsInfoWithoutWeather() {
                List<PortNameEntity> portNames = portNameRepository.findAll();
                List<PortInfoResponseDTO> responseDTOList = new ArrayList<>();

                for (PortNameEntity portName : portNames) {

                        String portId = portName.getPortInfo().getPortId();
                        PortInfoEntity info = portInfoRepository.findById(portId)
                                        .orElse(null);

                        if (info == null)
                                continue;

                        PortNameDTO portNameDTO = PortNameDTO.builder()
                                        .portId(portId)
                                        .countryNameKr(portName.getCountryNameKr())
                                        .countryNameEn(portName.getCountryNameEn())
                                        .countryNameJp(portName.getCountryNameJp())
                                        .portNameKr(portName.getPortNameKr())
                                        .portNameEn(portName.getPortNameEn())
                                        .portNameJp(portName.getPortNameJp())
                                        .locLat(info.getLocLat())
                                        .locLon(info.getLocLon())
                                        .build();

                        PortInfoResponseDTO dto = PortInfoResponseDTO.builder()
                                        .portNameDTO(portNameDTO)
                                        .build();

                        responseDTOList.add(dto);
                }

                return responseDTOList;
        }

        public List<PortInfoResponseDTO> getPortsInfoByCountry(String country) {
                List<PortNameEntity> portNames = portNameRepository.findByCountryNameEn(country);

                return portNames.stream().map(portName -> {
                        String portId = portName.getPortInfo().getPortId();
                        PortInfoEntity info = portInfoRepository.findByPortId(portId);

                        return PortInfoResponseDTO.builder()
                                        .portNameDTO(PortNameDTO.builder()
                                                        .portId(portId)
                                                        .countryNameKr(portName.getCountryNameKr())
                                                        .countryNameEn(portName.getCountryNameEn())
                                                        .countryNameJp(portName.getCountryNameJp())
                                                        .portNameKr(portName.getPortNameKr())
                                                        .portNameEn(portName.getPortNameEn())
                                                        .portNameJp(portName.getPortNameJp())
                                                        .locLat(info.getLocLat())
                                                        .locLon(info.getLocLon())
                                                        .build())
                                        .build();
                }).toList();
        }
}
