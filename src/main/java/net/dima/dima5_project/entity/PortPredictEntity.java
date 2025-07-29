package net.dima.dima5_project.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import net.dima.dima5_project.dto.PortPredictDTO;

@Entity
@Table(name="port_predict")
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class PortPredictEntity {
    
    private int predictSeq;
    private String portId;
    private int clusterNum;
    private String vesselId;
    private int timePoint;
    private LocalDateTime timeStamp;
    private LocalDateTime eta;
    private LocalDateTime ata;
    private double etaErrorHour;
    private double lat;
    private double lon;
    private double cog;
    private double heading;
    private String top1Port;
    private double top1Prob;
    private String top2Port;
    private double top2Prob;
    private String top3Port;
    private double top3Prob;

    public static PortPredictEntity toEntity(PortPredictDTO portPredictDTO){
        return PortPredictEntity.builder()
            .predictSeq(portPredictDTO.getPredictSeq())
            .portId(portPredictDTO.getPortId())
            .clusterNum(portPredictDTO.getClusterNum())
            .vesselId(portPredictDTO.getVesselId())
            .timePoint(portPredictDTO.getTimePoint())
            .timeStamp(portPredictDTO.getTimeStamp())
            .eta(portPredictDTO.getEta())
            .ata(portPredictDTO.getAta())
            .etaErrorHour(portPredictDTO.getEtaErrorHour())
            .lat(portPredictDTO.getLat())
            .lon(portPredictDTO.getLon())
            .cog(portPredictDTO.getCog())
            .heading(portPredictDTO.getHeading())
            .top1Port(portPredictDTO.getTop1Port())
            .top1Prob(portPredictDTO.getTop1Prob())
            .top2Port(portPredictDTO.getTop2Port())
            .top2Prob(portPredictDTO.getTop2Prob())
            .top3Port(portPredictDTO.getTop3Port())
            .top3Prob(portPredictDTO.getTop3Prob())
            .build();
    }
}
