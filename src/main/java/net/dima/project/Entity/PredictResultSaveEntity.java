package net.dima.project.Entity;

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

@Entity
@Table(name = "predict_result_save")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PredictResultSaveEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "result_seq")
    private Integer resultSeq;

    @ManyToOne
    @JoinColumn(name = "user_id", referencedColumnName = "user_id")
    private PredictUserEntity user;

    @Column(name = "vessel_alias")
    private String vesselAlias;

    @Column(name = "lat")
    private Double lat;

    @Column(name = "lon")
    private Double lon;

    @Column(name = "cog")
    private Double cog;

    @Column(name = "heading")
    private Double heading;

    @Column(name = "top1_port")
    private String top1Port;

    @Column(name = "top1_prob")
    private Double top1Prob;

    @Column(name = "eta")
    private LocalDateTime eta;
}
