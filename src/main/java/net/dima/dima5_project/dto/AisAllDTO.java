package net.dima.dima5_project.dto;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import net.dima.dima5_project.entity.AisAllEntity;
import net.dima.dima5_project.entity.PortInfoEntity;
import net.dima.dima5_project.entity.VesselMasterEntity;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class AisAllDTO {

    private Long aisSeq;
    private PortInfoEntity portId;
    private VesselMasterEntity vslId;
    private LocalDateTime timeStamp;
    private double lat;
    private double lon;   
    private double cog;
    private double heading;

    public static AisAllDTO toDTO(AisAllEntity aisAllEntity) {
        return AisAllDTO.builder()
            .aisSeq(aisAllEntity.getAisSeq())
            .portId(aisAllEntity.getPortId())
            .timeStamp(aisAllEntity.getTimeStamp())
            .lat(aisAllEntity.getLat())
            .lon(aisAllEntity.getLon())
            .cog(aisAllEntity.getCog())
            .heading(aisAllEntity.getHeading())
            .build();
    }
}
