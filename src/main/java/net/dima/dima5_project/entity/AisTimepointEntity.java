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
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import net.dima.dima5_project.dto.AisTimepointDTO;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class AisTimepointEntity {
    
    @Id 
    @GeneratedValue(strategy=GenerationType.IDENTITY)
    @Column(name="ais_seq")
    private Long aisSeq;

    @ManyToOne(fetch=FetchType.LAZY)
    @JoinColumn(name="port_id", referencedColumnName="port_id", nullable=false)
    private PortInfoEntity portId;

    @ManyToOne(fetch=FetchType.LAZY)
    @JoinColumn(name="vsl_id", referencedColumnName="vsl_id", nullable=false)
    private VesselMasterEntity vslId;

    @Column(name="time_stamp", nullable=false) 
    private LocalDateTime timeStamp;
    
    @Column(name="time_point", nullable=false) 
    private Integer timePoint;

    private double lat;
    private double lon;
    private double cog;
    private double heading;

    public static AisTimepointEntity toDTO(AisTimepointDTO aisTimepointDTO) {
        return AisTimepointEntity.builder()
                .aisSeq(aisTimepointDTO.getAisSeq())
                .portId(aisTimepointDTO.getPortId())
                .vslId(aisTimepointDTO.getVslId())
                .timeStamp(aisTimepointDTO.getTimeStamp())
                .timePoint(aisTimepointDTO.getTimePoint())
                .lat(aisTimepointDTO.getLat())
                .lon(aisTimepointDTO.getLon())
                .cog(aisTimepointDTO.getCog())
                .heading(aisTimepointDTO.getHeading())
                .build();
    }

}
