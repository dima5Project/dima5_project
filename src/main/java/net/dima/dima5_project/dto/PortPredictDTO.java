package net.dima.dima5_project.dto;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class PortPredictDTO {

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

    // public static PortPredictDTO toDTO(PortPredictEntity portPredictEntity){
    //     return PortPredictDTO.builder()
    //         .predictSeq(portPredictEntity.getPredictSeq())
    //         .portId(portPredictEntity.getPortId())
    //         .clusterNum(portPredictEntity.getClusterNum())
    //         .vesselId(portPredictEntity.getVesselId())
    //         .timePoint(portPredictEntity.getTimePoint())
    //         .timeStamp(portPredictEntity.getTimeStamp())
    //         .eta(portPredictEntity.getEta())
    //         .ata(portPredictEntity.getAta())
    //         .etaErrorHour(portPredictEntity.getEtaErrorHour())
    //         .lat(portPredictEntity.getLat())
    //         .lon(portPredictEntity.getLon())
    //         .cog(portPredictEntity.getCog())
    //         .heading(portPredictEntity.getHeading())
    //         .top1Port(portPredictEntity.getTop1Port())
    //         .top1Prob(portPredictEntity.getTop1Prob())
    //         .top2Port(portPredictEntity.getTop2Port())
    //         .top2Prob(portPredictEntity.getTop2Prob())
    //         .top3Port(portPredictEntity.getTop3Port())
    //         .top3Prob(portPredictEntity.getTop3Prob())
    //         .build();
    // }
}
