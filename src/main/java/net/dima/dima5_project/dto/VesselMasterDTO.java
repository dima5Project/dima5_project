package net.dima.dima5_project.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import net.dima.dima5_project.entity.VesselMasterEntity;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class VesselMasterDTO {
    
    private Integer vslSeq;
    private String vslId;
    private String vslName;
    private String vslMmsi;
    private String vslImo;
    private String shipType;
    private String callSign;
    private Integer vslLength;
    private Integer vslWidth;

    public static VesselMasterDTO toDTO(VesselMasterEntity vesselMasterEntity) {
        return VesselMasterDTO.builder()
                .vslSeq(vesselMasterEntity.getVslSeq())
                .vslId(vesselMasterEntity.getVslId())
                .vslName(vesselMasterEntity.getVslName())
                .vslMmsi(vesselMasterEntity.getVslMmsi())
                .vslImo(vesselMasterEntity.getVslImo())
                .shipType(vesselMasterEntity.getShipType())
                .callSign(vesselMasterEntity.getCallSign())
                .vslLength(vesselMasterEntity.getVslLength())
                .vslWidth(vesselMasterEntity.getVslWidth())
                .build();
    }

}
