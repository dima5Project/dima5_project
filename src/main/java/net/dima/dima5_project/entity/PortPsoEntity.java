package net.dima.dima5_project.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
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
@Table(name = "port_pso")
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class PortPsoEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "pso_seq")
    private Long psoSeq;

    // ManyToOne: 여러 PSO가 하나의 PortInfo에 연결됨
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "port_id")
    private PortInfoEntity portId;

    @Column(name = "pso_lat")
    private double psoLat;

    @Column(name = "pso_lon")
    private double psoLon;

    public static PortPsoEntity toDTO(PortPsoDTO portPsoDTO) {
        PortInfoEntity portInfo = new PortInfoEntity();
        portInfo.setPortId(portPsoDTO.getPortId()); // 문자열 → 엔티티로 변환

        return PortPsoEntity.builder()
                .psoSeq(portPsoDTO.getPsoSeq())
                .portId(portInfo)
                .psoLat(portPsoDTO.getPsoLat())
                .psoLon(portPsoDTO.getPsoLon())
                .build();
    }

}
