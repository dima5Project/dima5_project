package net.dima.dima5_project.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import net.dima.dima5_project.dto.PredictUserDTO;

@Entity
@Table(name = "predict_user")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PredictUserEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "user_seq")
    private Long userSeq;

    @Column(name = "user_name")
    private String userName;

    @Column(name = "user_id", unique = true)
    private String userId;

    @Column(name = "user_pwd")
    private String userPwd;

    @Column(name = "user_email")
    private String userEmail;

    @Column(name = "user_type")
    private String userType;

    @Column(name = "user_role")
    private String userRole;

    public static PredictUserEntity toEntity(PredictUserDTO predictUserDTO) {
        return PredictUserEntity.builder()
                .userSeq(predictUserDTO.getUserSeq())
                .userName(predictUserDTO.getUserName())
                .userId(predictUserDTO.getUserId())
                .userPwd(predictUserDTO.getUserPwd())
                .userEmail(predictUserDTO.getUserEmail())
                .userType(predictUserDTO.getUserType())
                .userRole(predictUserDTO.getUserRole())
                .build();
    }
}
