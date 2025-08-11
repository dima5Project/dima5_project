package net.dima.dima5_project.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import net.dima.dima5_project.dto.AskBoardDTO;
import net.dima.dima5_project.dto.PredictResultSaveDTO;

@Entity
@Table(name = "result_save")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PredictResultSaveEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "save_seq")
    private Integer saveSeq;

    @ManyToOne
    @Column(name="user_id")
    private PredictUserEntity userId;

    private Double lat;
    private Double lon;

    @Column(name = "top1_port")
    private String top1Port;

    @Column(name = "top1_prob")
    private Double top1Prob;

    @Column(name = "eta")
    private LocalDateTime eta;

    public static PredictResultSaveEntity toEntity(PredictResultSaveDTO predictResultSaveDTO) {
        return PredictResultSaveEntity.builder()
                .saveSeq(predictResultSaveDTO.getSaveSeq())
                //.userId(predictResultSaveDTO.getUserId())
                .lat(predictResultSaveDTO.getLat())
                .lon(predictResultSaveDTO.getLon())
                .top1Port(predictResultSaveDTO.getTop1Port())
                .top1Prob(predictResultSaveDTO.getTop1Prob())
                .eta(predictResultSaveDTO.getEta())
                .build();
    }



}
