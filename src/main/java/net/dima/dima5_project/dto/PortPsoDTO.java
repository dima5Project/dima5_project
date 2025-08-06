package net.dima.dima5_project.dto;

import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import net.dima.dima5_project.entity.PortPsoEntity;

@Data
@AllArgsConstructor
@Table(name = "port_pso")
@NoArgsConstructor
@Builder
public class PortPsoDTO {

    private Long psoSeq;
    private String portId;
    private double psoLat;
    private double psoLon;

    public static PortPsoDTO toDTO(PortPsoEntity portPsoEntity) {

        return PortPsoDTO.builder()
                .psoSeq(portPsoEntity.getPsoSeq())
                .portId(portPsoEntity.getPortId().getPortId())
                .psoLat(portPsoEntity.getPsoLat())
                .psoLon(portPsoEntity.getPsoLon())
                .build();
    }
}
