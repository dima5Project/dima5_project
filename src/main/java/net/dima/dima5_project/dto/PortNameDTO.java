package net.dima.dima5_project.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import net.dima.dima5_project.entity.PortNameEntity;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class PortNameDTO {

    private String portId;
    private String countryNameKr;
    private String portNameKr;
    private String countryNameEn;
    private String portNameEn;
    private String countryNameJp;
    private String portNameJp;

    // 위경도 정보 추가
    private double locLat;
    private double locLon;

    public static PortNameDTO toDTO(PortNameEntity portNameEntity) {
        return PortNameDTO.builder()
                .portId(portNameEntity.getPortInfo().getPortId())
                .countryNameKr(portNameEntity.getCountryNameKr())
                .portNameKr(portNameEntity.getPortNameKr())
                .countryNameEn(portNameEntity.getCountryNameEn())
                .portNameEn(portNameEntity.getPortNameEn())
                .countryNameJp(portNameEntity.getCountryNameJp())
                .portNameJp(portNameEntity.getPortNameJp())
                .build();
    }
}
