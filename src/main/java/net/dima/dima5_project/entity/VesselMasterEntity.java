package net.dima.dima5_project.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import net.dima.dima5_project.dto.VesselMasterDTO;


@Entity
@Table(name="vessel_master")
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class VesselMasterEntity {
    
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer vslSeq;

    @Column(name="vsl_id")
    private String vslId;

    @Column(name="vsl_name")
    private String vslName;

    @Column(name="vsl_mmsi")
    private String vslMmsi;

    @Column(name="vsl_imo")
    private String vslImo;

    @Column(name="ship_type")
    private String shipType;

    @Column(name="call_sign")
    private String callSign;

    @Column(name="vsl_length")
    private Integer vslLength;

    @Column(name="vsl_width")
    private Integer vslWidth;

    public static VesselMasterEntity toEntity(VesselMasterDTO vesselMasterDTO) {
        return VesselMasterEntity.builder()
                .vslSeq(vesselMasterDTO.getVslSeq())
                .vslId(vesselMasterDTO.getVslId())
                .vslName(vesselMasterDTO.getVslName())
                .vslMmsi(vesselMasterDTO.getVslMmsi())
                .vslImo(vesselMasterDTO.getVslImo())
                .shipType(vesselMasterDTO.getShipType())
                .callSign(vesselMasterDTO.getCallSign())
                .vslLength(vesselMasterDTO.getVslLength())
                .vslWidth(vesselMasterDTO.getVslWidth())
                .build();
    }

}

