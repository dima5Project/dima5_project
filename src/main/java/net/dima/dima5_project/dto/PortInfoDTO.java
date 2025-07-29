package net.dima.dima5_project.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import net.dima.dima5_project.entity.PortInfoEntity;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class PortInfoDTO {

    private String portId;
    private double locLat;
    private double locLon;

    public static PortInfoDTO toDTO(PortInfoEntity portInfoEntity) {
        return PortInfoDTO.builder()
            .portId(portInfoEntity.getPortId())
            .locLat(portInfoEntity.getLocLat())
            .locLon(portInfoEntity.getLocLon())
            .build();
    }
}
