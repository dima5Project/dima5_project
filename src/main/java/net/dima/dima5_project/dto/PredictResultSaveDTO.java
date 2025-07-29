package net.dima.dima5_project.dto;

import java.time.LocalDateTime;

import lombok.Builder;
import lombok.Data;

import net.dima.dima5_project.entity.PredictUserEntity;

@Data
@Builder
public class PredictResultSaveDTO {
    private Integer resultSeq;
    private PredictUserEntity user; // user → ID로 축소
    private String vesselAlias;
    private Double lat;
    private Double lon;
    private Double cog;
    private Double heading;
    private String top1Port;
    private Double top1Prob;
    private LocalDateTime eta;

    // public static PredictResultSaveDTO toDTO(PredictResultSaveEntity
    // predictResultSaveEntity) {
    // return PredictResultSaveDTO.builder()
    // .resultSeq(predictResultSaveEntity.getResultSeq())
    // .user(predictResultSaveEntity.getUser())
    // .vesselAlias(predictResultSaveEntity.getVesselAlias())
    // .lat(predictResultSaveEntity.getLat())
    // .lon(predictResultSaveEntity.getLon())
    // .cog(predictResultSaveEntity.getCog())
    // .heading(predictResultSaveEntity.getHeading())
    // .top1Port(predictResultSaveEntity.getTop1Port())
    // .top1Prob(predictResultSaveEntity.getTop1Prob())
    // .eta(predictResultSaveEntity.getEta())
    // .build();
    // }

}
