package net.dima.dima5_project.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import net.dima.dima5_project.entity.PortPredictEntity;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class PortPredictDTO {

        private long predictSeq; // 시퀀스 번호
        private String portId; // 항구 ID (도착항 예측 결과 중 Top1 기준)
        private int clusterNum; // 예측된 군집 번호

        private String vesselId; // 선박 ID
        private int timePoint; // 시점
        private LocalDateTime timeStamp;

        private LocalDateTime eta;
        private LocalDateTime ata;
        private double etaErrorHour;

        private double lat;
        private double lon;
        private double cog;
        private double heading;

        private String top1Port; // UN/LOCODE
        private double top1Prob;
        private String top2Port;
        private double top2Prob;
        private String top3Port;
        private double top3Prob;

        // 💡연관 테이블 DTO
        private PortNameDTO portNameInfo;
        private PortInfoDTO portInfoInfo;
        private PortPsoDTO portPsoInfo;

        public static PortPredictDTO toDTO(PortPredictEntity entity) {
                return PortPredictDTO.builder()
                                .predictSeq(entity.getPredictSeq())
                                .portId(entity.getPortId())
                                .clusterNum(entity.getClusterNum())
                                .vesselId(entity.getVesselId())
                                .timePoint(entity.getTimePoint())
                                .timeStamp(entity.getTimeStamp())
                                .eta(entity.getEta())
                                .ata(entity.getAta())
                                .etaErrorHour(entity.getEtaErrorHour())
                                .lat(entity.getLat())
                                .lon(entity.getLon())
                                .cog(entity.getCog())
                                .heading(entity.getHeading())
                                .top1Port(entity.getTop1Port())
                                .top1Prob(entity.getTop1Prob())
                                .top2Port(entity.getTop2Port())
                                .top2Prob(entity.getTop2Prob())
                                .top3Port(entity.getTop3Port())
                                .top3Prob(entity.getTop3Prob())
                                .build();
        }
}
