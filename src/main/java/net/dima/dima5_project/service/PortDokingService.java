package net.dima.dima5_project.service;

import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;
import net.dima.dima5_project.dto.PortDockingDTO;
import net.dima.dima5_project.entity.PortDockingEntity;
import net.dima.dima5_project.repository.PortDockingRepository;

// 정박 수 + 입항 예정 수
@Service
@RequiredArgsConstructor
public class PortDokingService {
    private final PortDockingRepository portDockingRepository;

    public PortDockingDTO getLatestDockingInfo(String portId) {
        PortDockingEntity portDockingEntity = portDockingRepository
                .findTopByPortIdOrderByTimestampDesc(portId)
                .orElseThrow(() -> new RuntimeException("정박 정보가 존재하지 않습니다."));

        return PortDockingDTO.builder()
                .portId(portDockingEntity.getPortId())
                .shipsInPort(portDockingEntity.getShipsInPort())
                .expectedShips(portDockingEntity.getExpectedShips())
                .timestamp(portDockingEntity.getTimestamp())
                .build();
    }
}
