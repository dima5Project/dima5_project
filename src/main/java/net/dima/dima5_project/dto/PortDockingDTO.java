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
    private Integer shipsInPort;
    private Integer expectedShips;
    private LocalDateTime timestamp;

    public static PortDockingDTO toDTO(PortDockingEntity portDockingEntity) {
        return PortDockingDTO.builder()
                .dockingId(portDockingEntity.getDockingId())
                .portId(portDockingEntity.getPortId())
                .shipsInPort(portDockingEntity.getShipsInPort())
                .expectedShips(portDockingEntity.getExpectedShips())
                .timestamp(portDockingEntity.getTimestamp())
                .build();
    }
}
