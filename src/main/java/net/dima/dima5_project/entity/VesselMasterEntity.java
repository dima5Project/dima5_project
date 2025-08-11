package net.dima.dima5_project.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;

@Entity
@Table(name="vessel_master")
@Data
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


}

