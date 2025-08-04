package net.dima.dima5_project.service;

import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.dima.dima5_project.dto.PortInfoResponseDTO;
import net.dima.dima5_project.dto.PortInfoResponseDTO.ExchangeDTO;
import net.dima.dima5_project.dto.PortInfoResponseDTO.WeatherDTO;
import net.dima.dima5_project.dto.PortNameDTO;
import net.dima.dima5_project.entity.PortDockingEntity;
import net.dima.dima5_project.entity.PortInfoEntity;
import net.dima.dima5_project.entity.PortNameEntity;
import net.dima.dima5_project.repository.PortDockingRepository;
import net.dima.dima5_project.repository.PortInfoRepository;
import net.dima.dima5_project.repository.PortNameRepository;

@Service
@RequiredArgsConstructor
@Slf4j
public class PortInfoService {

        private final PortInfoRepository portInfoRepository;
        private final PortDockingRepository portDockingRepository;
        private final PortNameRepository portNameRepository;
        private final ExchangeService exchangeService;
        private final WeatherService weatherService;

        // 전체 항구 정보 조회
        public List<PortInfoResponseDTO> getAllPortsInfo() {
                List<PortInfoEntity> portList = portInfoRepository.findAll();
                List<PortInfoResponseDTO> result = new ArrayList<>();

                for (PortInfoEntity port : portList) {

                        // 포트명 기준으로 포트 이름/국가 메타데이터 가져오기
                        PortNameEntity portNameEntity = portNameRepository.findById(port.getPortId()).orElse(null);
                        if (portNameEntity == null)
                                continue;

                        PortNameDTO portNameDTO = PortNameDTO.toDTO(portNameEntity);

                        // 정박 정보
                        PortDockingEntity docking = portDockingRepository
                                        .findTopByPortNameOrderByTimestampDesc(portNameEntity.getPortNameKr())
                                        .orElse(null);
                        int shipsInPort = docking != null ? docking.getShipsInPort() : 0;
                        int expectedShips = docking != null ? docking.getExpectedShips() : 0;

                        // 날씨 정보
                        WeatherDTO weather = weatherService.getWeatherInfo(
                                        portNameEntity.getPortNameKr(),
                                        port.getLocLat(),
                                        port.getLocLon());

                        // 환율 정보
                        List<ExchangeDTO> exchanges = exchangeService.getExchangeInfoList();

                        // DTO 조립
                        result.add(
                                        PortInfoResponseDTO.builder()
                                                        .portNameInfo(portNameDTO)
                                                        .shipsInPort(shipsInPort)
                                                        .expectedShips(expectedShips)
                                                        .weather(weather)
                                                        .exchanges(exchanges)
                                                        .build());
                }

                return result;
        }

        // 단일 항구 정보 조회
        public PortInfoResponseDTO getPortInfo(String portId) {
                PortInfoEntity port = portInfoRepository.findByPortId(portId);
                if (port == null)
                        throw new RuntimeException("해당 portId에 해당하는 항구 없음: " + portId);

                PortNameEntity portNameEntity = portNameRepository.findById(port.getPortId()).orElse(null);
                if (portNameEntity == null)
                        throw new RuntimeException("PortName 정보 없음: " + port.getPortId());

                PortNameDTO portNameDTO = PortNameDTO.toDTO(portNameEntity);

                PortDockingEntity docking = portDockingRepository
                                .findTopByPortNameOrderByTimestampDesc(portNameEntity.getPortNameKr())
                                .orElse(null);
                int shipsInPort = docking != null ? docking.getShipsInPort() : 0;
                int expectedShips = docking != null ? docking.getExpectedShips() : 0;

                WeatherDTO weather = weatherService.getWeatherInfo(
                                portNameEntity.getPortNameKr(),
                                port.getLocLat(),
                                port.getLocLon());

                List<ExchangeDTO> exchanges = exchangeService.getExchangeInfoList();

                return PortInfoResponseDTO.builder()
                                .portNameInfo(portNameDTO)
                                .shipsInPort(shipsInPort)
                                .expectedShips(expectedShips)
                                .weather(weather)
                                .exchanges(exchanges)
                                .build();
        }
}
