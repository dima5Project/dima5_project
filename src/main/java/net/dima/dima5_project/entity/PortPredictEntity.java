package net.dima.dima5_project.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name="port_predict")
@Data
@AllArgsConstructor
@NoArgsConstructor
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
}
