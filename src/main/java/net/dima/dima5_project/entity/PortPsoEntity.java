package net.dima.dima5_project.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import net.dima.dima5_project.dto.PortPsoDTO;

@Entity
@Table(name="port_pso")
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class PortPsoEntity {
    
    @Id
    @Column(name="pso_seq")
    private int psoSeq;

    @Column(name="port_id")
    private String portId;
    
    @Column(name="pso_lat")
    private double psoLat;

    @Column(name="pso_lon")
    private double psoLon;

    // 주인 테이블 (predict 기준으로 port 정보 접근 가능)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "port_id")
    private PortInfoEntity portInfo;


    public static PortPsoEntity toDTO(PortPsoDTO portPsoDTO) {
        return PortPsoEntity.builder()
            .psoSeq(portPsoDTO.getPsoSeq())
            .portId(portPsoDTO.getPortId())
            .psoLat(portPsoDTO.getPsoLat())
            .psoLon(portPsoDTO.getPsoLon())
            .build();
    }

}
