package net.dima.dima5_project.entity;

import java.time.LocalDateTime;

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
import net.dima.dima5_project.dto.AisAllDTO;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Table(name="ais_all")
public class AisAllEntity {
    
    @Id
    @GeneratedValue(strategy=GenerationType.IDENTITY)
    @Column(name="ais_seq")
    private Long aisSeq;

    @ManyToOne(fetch=FetchType.LAZY)
    @JoinColumn(name="port_id", referencedColumnName="port_id", nullable=false)
    private PortInfoEntity portId;

    // FK가 vsl_id(UNIQUE)라서 referencedColumnName="vsl_id"
    @ManyToOne(fetch=FetchType.LAZY)
    @JoinColumn(name="vsl_id", referencedColumnName="vsl_id", nullable=false)
    private VesselMasterEntity vslId;

    @Column(name="time_stamp", nullable=false)
    private LocalDateTime timeStamp;

    private double lat;
    private double lon;
    private double cog;
    private double heading;

    public static AisAllEntity toDTO(AisAllDTO aisAllDTO) {
        return AisAllEntity.builder()
            .aisSeq(aisAllDTO.getAisSeq())
            .portId(aisAllDTO.getPortId())
            .timeStamp(aisAllDTO.getTimeStamp())
            .lat(aisAllDTO.getLat())
            .lon(aisAllDTO.getLon())
            .cog(aisAllDTO.getCog())
            .heading(aisAllDTO.getHeading())
            .build();
    }


}
