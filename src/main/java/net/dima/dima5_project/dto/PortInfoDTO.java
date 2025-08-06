package net.dima.dima5_project.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

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
}
