package net.dima.dima5_project.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import net.dima.dima5_project.dto.ResultSaveDTO;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Table(name = "result_save")
@Entity
public class ResultSaveEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "save_seq")
    private Long saveSeq;

    // FK: result_save.search_vsl -> vessel_master.vsl_id
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "search_vsl", referencedColumnName = "vsl_id", nullable = false)
    private VesselMasterEntity searchVsl;

    // FK: result_save.user_id -> predict_user.user_id
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", referencedColumnName = "user_id", nullable = false)
    private PredictUserEntity userId;

    private double lat;
    private double lon;

    @Column(name = "top1_port")
    private String top1Port;

    @Column(name = "top1_pred")
    private Double top1Pred;

    @Column(name = "eta")
    private LocalDateTime eta;

    public static ResultSaveEntity fromDTO(ResultSaveDTO dto,
            VesselMasterEntity vsl, // vslId로 조회해 온 엔티티
            PredictUserEntity user) { // userId로 조회해 온 엔티티
        return ResultSaveEntity.builder()
                .saveSeq(dto.getSaveSeq())
                .searchVsl(vsl)
                .userId(user)
                .lat(dto.getLat())
                .lon(dto.getLon())
                .top1Port(dto.getTop1Port())
                .top1Pred(dto.getTop1Pred())
                .eta(dto.getEta())
                .build();
    }
}
