package net.dima.dima5_project.dto;


import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import net.dima.dima5_project.entity.PortInfoEntity;
import net.dima.dima5_project.entity.PortNameEntity;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class PortInfoDTO {

    private String portId;
    private double locLat;
    private double locLon;

    // port_name 테이블 정보 전체를 포함
    private PortNameDTO portNameInfo;

    // holidayDTO 값을 실제로 사용하는 코드
    private HolidayDTO holidayInfo;

    public static PortInfoDTO toDTO(PortInfoEntity infoEntity, PortNameEntity nameEntity) {
        return PortInfoDTO.builder()
                .portId(infoEntity.getPortId())
                .locLat(infoEntity.getLocLat())
                .locLon(infoEntity.getLocLon())
                .portNameInfo(PortNameDTO.toDTO(nameEntity)) // PortNameEntity → PortNameDTO
                .build();
    }

}
