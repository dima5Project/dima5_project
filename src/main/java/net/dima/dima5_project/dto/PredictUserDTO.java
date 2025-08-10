package net.dima.dima5_project.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import net.dima.dima5_project.entity.PredictUserEntity;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PredictUserDTO {
    private Long userSeq;
    private String userName;
    private String userId;
    private String userPwd;
    private String userEmail;
    private String userType;
    private String userRole;

    public static PredictUserDTO toDTO(PredictUserEntity predictUserEntity) {
        return PredictUserDTO.builder()
                .userSeq(predictUserEntity.getUserSeq())
                .userName(predictUserEntity.getUserName())
                .userId(predictUserEntity.getUserId())
                .userPwd(predictUserEntity.getUserPwd())
                .userEmail(predictUserEntity.getUserEmail())
                .userType(predictUserEntity.getUserType())
                .userRole(predictUserEntity.getUserRole())
                .build();
    }
}