package net.dima.dima5_project.dto;

import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonFormat;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import net.dima.dima5_project.entity.ResultSaveEntity;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class ResultSaveDTO {

    private Long saveSeq;
    private String searchVsl;
    private String userId;
    private double lat;
    private double lon;
    private String top1Port;
    private Double top1Pred;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime eta;

    public static ResultSaveDTO toDTO(ResultSaveEntity resultSaveEntity) {
        return ResultSaveDTO.builder()
                .saveSeq(resultSaveEntity.getSaveSeq())
                .searchVsl(resultSaveEntity.getSearchVsl())
                .userId(resultSaveEntity.getUserId().getUserId())
                .lat(resultSaveEntity.getLat())
                .lon(resultSaveEntity.getLon())
                .top1Port(resultSaveEntity.getTop1Port())
                .top1Pred(resultSaveEntity.getTop1Pred())
                .eta(resultSaveEntity.getEta())
                .build();
    }

    
}
