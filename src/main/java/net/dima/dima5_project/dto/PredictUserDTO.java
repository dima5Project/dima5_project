package net.dima.dima5_project.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PredictUserDTO {
    private Integer userSeq;
    private String userName;
    private String userId;
    private String userEmail;
    private String userType;
    private String userRole;

    // public static PredictUserDTO toDTO(PredictUserEntity predictUserEntity) {
    // return PredictUserDTO.builder()
    // .userSeq(predictUserEntity.getUserSeq())
    // .userName(predictUserEntity.getUserName())
    // .userId(predictUserEntity.getUserId())
    // .userEmail(predictUserEntity.getUserEmail())
    // .userType(predictUserEntity.getUserType())
    // .userRole(predictUserEntity.getUserRole())
    // .build();
    // }
}