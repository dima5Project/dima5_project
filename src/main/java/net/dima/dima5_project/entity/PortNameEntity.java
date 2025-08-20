package net.dima.dima5_project.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import net.dima.dima5_project.dto.PortNameDTO;

@Entity
@Table(name = "port_name")
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class PortNameEntity {

    @Id
    @Column(name = "port_id")
    private String portId; // PK

    @Column(name = "country_name_kr")
    private String countryNameKr;

    @Column(name = "port_name_kr")
    private String portNameKr;

    @Column(name = "country_name_en")
    private String countryNameEn;

    @Column(name = "port_name_en")
    private String portNameEn;

    // @Column(name = "country_name_jp")
    // private String countryNameJp;

    // @Column(name = "port_name_jp")
    // private String portNameJp;

    // FK 관계를 통해 필요할 때, PortInfoEntity 데이터를 가져올 수 있음
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "port_id", referencedColumnName = "port_id", insertable = false, updatable = false)
    private PortInfoEntity portInfo;

    public static PortNameEntity toEntity(PortNameDTO portNameDTO, PortInfoEntity portInfoEntity) {
        return PortNameEntity.builder()
                .portInfo(portInfoEntity)
                .portNameKr(portNameDTO.getPortNameKr())
                .countryNameKr(portNameDTO.getCountryNameKr())
                .portNameEn(portNameDTO.getPortNameEn())
                .countryNameEn(portNameDTO.getCountryNameEn())
                // .portNameJp(portNameDTO.getPortNameJp())
                // .countryNameJp(portNameDTO.getCountryNameJp())
                .build();
    }

}
