package net.dima.dima5_project.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;


@Entity
@Table(name="port_info")
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class PortInfoEntity {
    
    @Id
    @Column(name="port_id")
    private String portId;
    
    @Column(name="loc_lat")
    private double locLat;

    @Column(name="loc_lon")
    private double locLon;

    // public static PortInfoEntity toEntity(PortInfoDTO PortInfoDTO) {
    //     return PortInfoEntity.builder()
    //         .portId(PortInfoDTO.getPortId())
    //         .locLat(PortInfoDTO.getLocLat())
    //         .locLon(PortInfoDTO.getLocLon())
    //         .build();
    // }
    
}
