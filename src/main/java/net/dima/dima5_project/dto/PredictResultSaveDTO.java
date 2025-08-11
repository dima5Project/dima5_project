package net.dima.dima5_project.dto;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import net.dima.dima5_project.entity.PredictResultSaveEntity;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class PredictResultSaveDTO {
    
    private Integer saveSeq;
    private String searchVsl;
    private String userId;
    private double lat;
    private double lon;
    private String top1Port;
    private double top1Prob;
    private LocalDateTime eta;

    // public static PredictResultSaveDTO toDTO(PredictResultSaveEntity predictResultSaveEntity) {
    //     return PredictResultSaveDTO.builder()
    //         .saveSeq(predictResultSaveEntity.getSaveSeq())
    //         .searchVsl(predictResultSaveEntity.getSearchVsl())
    //         .UserId(predictResultSaveEntity.getUserId())
    //         .lat(predictResultSaveEntity.getLat())
    //         .lon(predictResultSaveEntity.getLon())
    //         .top1Port(predictResultSaveEntity.getTop1Port())
    //         .top1Prob(predictResultSaveEntity.getTop1Prob())
    //         .eta(predictResultSaveEntity.getEta())
    //         .build();
    // }

}
