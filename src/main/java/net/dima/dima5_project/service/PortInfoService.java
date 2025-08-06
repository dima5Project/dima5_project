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

                        // [1단계] 포트 이름/국가 메타데이터 가져오기
                        PortNameEntity portNameEntity = portNameRepository.findById(port.getPortId()).orElse(null);
                        if (portNameEntity == null)
                                continue;

                        PortNameDTO portNameDTO = PortNameDTO.toDTO(portNameEntity);
                        log.info("🔍 PortNameDTO: {}", portNameDTO); // 👈 여기에 추가

                        // [2단계] 정박 수 정보 가져오기 (portId 기준으로)
                        PortDockingEntity docking = portDockingRepository
                                        .findTopByPortIdOrderByTimestampDesc(port.getPortId())
                                        .orElse(null);

                        int shipsInPort = docking != null ? docking.getShipsInPort() : 0;
                        int expectedShips = docking != null ? docking.getExpectedShips() : 0;

                        // [3단계] 날씨 정보 가져오기
                        WeatherDTO weather = weatherService.getWeatherInfo(
                                        portNameEntity.getPortNameKr(), // 여기에 필요함!
                                        port.getLocLat(),
                                        port.getLocLon());

                        // [4단계] 환율 정보 가져오기
                        List<ExchangeDTO> exchanges = exchangeService.getExchangeInfoList();

                        // [5단계] 최종 DTO 조립
                        result.add(
                                        PortInfoResponseDTO.builder()
                                                        .portNameInfo(portNameDTO)
                                                        .shipsInPort(shipsInPort)
                                                        .expectedShips(expectedShips)
                                                        .weather(weather)
                                                        .exchanges(exchanges)
                                                        .locLat(port.getLocLat())
                                                        .locLon(port.getLocLon())
                                                        .build());
                }

                return result;
        }

        // 단일 항구 정보 조회
        public PortInfoResponseDTO getPortInfo(String portId) {
                // 1. port_info에서 정보 가져오기
                PortInfoEntity port = portInfoRepository.findByPortId(portId);
                if (port == null)
                        throw new RuntimeException("해당 portId에 해당하는 항구 없음: " + portId);

                // 2. port_name에서 메타 정보 가져오기
                PortNameEntity portNameEntity = portNameRepository.findById(port.getPortId()).orElse(null);
                if (portNameEntity == null)
                        throw new RuntimeException("PortName 정보 없음: " + port.getPortId());

                PortNameDTO portNameDTO = PortNameDTO.toDTO(portNameEntity);

                // ✅ 3. port_docking에서 정박 수 & 입항 예정 수 조회 (portId 기준)
                PortDockingEntity docking = portDockingRepository
                                .findTopByPortIdOrderByTimestampDesc(port.getPortId())
                                .orElse(null);

                int shipsInPort = docking != null ? docking.getShipsInPort() : 0;
                int expectedShips = docking != null ? docking.getExpectedShips() : 0;

                // 4. 날씨 정보 조회
                WeatherDTO weather = weatherService.getWeatherInfo(
                                portNameEntity.getPortNameKr(),
                                port.getLocLat(),
                                port.getLocLon());

                // 5. 환율 정보 조회
                List<ExchangeDTO> exchanges = exchangeService.getExchangeInfoList();

                // 6. 결과 DTO 조립
                return PortInfoResponseDTO.builder()
                                .portNameInfo(portNameDTO)
                                .shipsInPort(shipsInPort)
                                .expectedShips(expectedShips)
                                .weather(weather)
                                .exchanges(exchanges)
                                .locLat(port.getLocLat())
                                .locLon(port.getLocLon())
                                .build();
        }

        public PortInfoResponseDTO getPortInfoByPortName(String portName) {
                PortNameEntity nameEntity = portNameRepository.findByPortNameKr(portName)
                                .orElseThrow(() -> new RuntimeException("해당 항구명 없음: " + portName));

                String portId = nameEntity.getPortId();
                return getPortInfo(portId); // 기존 메서드 재활용
        }

        public List<PortNameDTO> getAllPortNames() {
                List<PortNameEntity> entities = portNameRepository.findAll();
                List<PortNameDTO> dtos = new ArrayList<>();
                for (PortNameEntity entity : entities) {
                        dtos.add(PortNameDTO.toDTO(entity));
                }
                return dtos;
        }
}
