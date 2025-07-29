package net.dima.dima5_project.entity;


import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name="port_name")
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class PortNameEntity {
    
    @Id
    @Column(name="port_id")
    private String portId;

    @Column(name="country_name_kr")
    private String countryNameKr;

    @Column(name="port_name_kr")
    private String portNameKr;

    @Column(name="country_name_en")
    private String countryNameEn;

    @Column(name="port_name_en")
    private String portNameEn;

    @Column(name="country_name_jp")
    private String countryNameJp;

    @Column(name="port_name_jp")
    private String portNameJp;


    

}
