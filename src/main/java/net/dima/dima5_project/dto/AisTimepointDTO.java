package net.dima.dima5_project.dto;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import net.dima.dima5_project.entity.AisTimepointEntity;
import net.dima.dima5_project.entity.PortInfoEntity;
import net.dima.dima5_project.entity.VesselMasterEntity;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class AisTimepointDTO {
    
    private Integer aisSeq;
    private PortInfoEntity portId;
    private VesselMasterEntity vslId;
    private LocalDateTime timeStamp;
    private Integer timePoint;
    private double lat;
    private double lon;
    private double cog;
    private double heading;

    public static AisTimepointDTO toDTO(AisTimepointEntity aisTimepointEntity) {
        return AisTimepointDTO.builder()
                .aisSeq(aisTimepointEntity.getAisSeq())
                .portId(aisTimepointEntity.getPortId()) // PortInfoEntity → port_id
                .vslId(aisTimepointEntity.getVslId())   // VesselMasterEntity → vsl_id
                .timeStamp(aisTimepointEntity.getTimeStamp())
                .timePoint(aisTimepointEntity.getTimePoint())
                .lat(aisTimepointEntity.getLat())
                .lon(aisTimepointEntity.getLon())
                .cog(aisTimepointEntity.getCog())
                .heading(aisTimepointEntity.getHeading())
                .build();
    }
}
