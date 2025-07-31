package net.dima.dima5_project.entity;

import java.time.LocalDateTime;

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
import net.dima.dima5_project.dto.PortPredictDTO;

@Entity
@Table(name="port_predict")
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class PortPredictEntity {
    
    @Id
    @Column(name="predict_seq")
    private Long predictSeq;

    // @Column(name="port_id")
    // private String portId;

    @Column(name="cluster_num")
    private int clusterNum;

    @Column(name="vessel_id")
    private String vesselId;

    @Column(name="time_point")
    private int timePoint;

    @Column(name="time_stamp")
    private LocalDateTime timeStamp;

    private LocalDateTime eta;
    private LocalDateTime ata;

    @Column(name="eta_error_hour")
    private double etaErrorHour;

    private double lat;
    private double lon;
    private double cog;
    private double heading;

    @Column(name="top1_port")
    private String top1Port;

    @Column(name="top1_prob")
    private double top1Prob;

    @Column(name="top2_port")
    private String top2Port;

    @Column(name="top2_prob")
    private double top2Prob;

    @Column(name="top3_port")
    private String top3Port;

    @Column(name="top3_prob")
    private double top3Prob;

    // 단방향 참조: PortInfo
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "port_id")
    private PortInfoEntity portInfo;

    // 단방향 참조: PortName
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "port_name_id")
    private PortNameEntity portName;

    // 단방향 참조: PortPso
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pso_seq")
    private PortPsoEntity portPso;

    public static PortPredictEntity toEntity(PortPredictDTO portPredictDTO){
        return PortPredictEntity.builder()
            .predictSeq(portPredictDTO.getPredictSeq())
            //.portId(portPredictDTO.getPortId())
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
