package net.dima.dima5_project.dto;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import net.dima.dima5_project.entity.PortDockingEntity;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PortDockingDTO {
    private Long dockingId;
    private String portId;
    private Integer currentShips;
    private Integer expectedShips;
    private LocalDateTime timeStamp;

    private String congestionLevel; // 혼잡도 등급 추가

    public static PortDockingDTO toDTO(PortDockingEntity portDockingEntity) {
        int total = portDockingEntity.getCurrentShips() + portDockingEntity.getExpectedShips();
        String level = (total >= 80) ? "매우 혼잡" : (total >= 40) ? "혼잡" : "여유";

        return PortDockingDTO.builder()
                .dockingId(portDockingEntity.getDockingId())
                .portId(portDockingEntity.getPortId())
                .currentShips(portDockingEntity.getCurrentShips())
                .expectedShips(portDockingEntity.getExpectedShips())
                .timeStamp(portDockingEntity.getTimeStamp())
                .build();
    }
}
