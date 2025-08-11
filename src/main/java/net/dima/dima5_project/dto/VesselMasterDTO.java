package net.dima.dima5_project.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
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


}
