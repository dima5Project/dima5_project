package net.dima.dima5_project.entity;

import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import net.dima.dima5_project.dto.PortInfoDTO;


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

    // 하나의 항구가 여러 개의 항구명을 갖는다 (1:N 관계)
    @OneToMany(mappedBy = "portInfo", fetch = FetchType.LAZY)
    private List<PortNameEntity> portNameList = new ArrayList<>();

    // 하나의 항구가 여러 개의 항로 좌표를 갖는다 (1:N 관계)
    @OneToMany(mappedBy = "portInfo", fetch = FetchType.LAZY)
    private List<PortPsoEntity> portPsoList = new ArrayList<>();


    public static PortInfoEntity toEntity(PortInfoDTO PortInfoDTO) {
        return PortInfoEntity.builder()
            .portId(PortInfoDTO.getPortId())
            .locLat(PortInfoDTO.getLocLat())
            .locLon(PortInfoDTO.getLocLon())
            .build();
    }
    
}
