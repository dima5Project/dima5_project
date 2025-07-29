package net.dima.project.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class PortInfoDTO {

    // DTO 수정중
    private String portId;
    private double locLat;
    private double locLon;

    // public static PortInfoDTO toDTO(portInfoEntity portInfoEntity) {
    //     return PortInfoDTO.builder()
    //         .portId(portInfoEntity.getPortId())
    //         .locLat(portInfoEntity.getLocLat())
    //         .locLon(portInfoEntity.getLocLon())
    //         .build();
    // }
}
