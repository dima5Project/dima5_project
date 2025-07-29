package net.dima.dima5_project.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class PortPsoDTO {
    private int psoSeq;
    private String portId;
    private double psoLat;
    private double psoLon;

    // public static PortPsoDTO toDTO(PortPsoEntity portPsoEntity) {
    //     return PortPsoDTO.builder()
    //         .psoSeq(portPsoEntity.getPsoSeq())
    //         .portId(portPsoEntity.getPortId())
    //         .psoLat(portPsoEntity.getPsoLat())
    //         .psoLon(portPsoEntity.getPsoLon())
    //         .build();
    // }
}
