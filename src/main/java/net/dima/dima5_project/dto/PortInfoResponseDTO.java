package net.dima.dima5_project.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class PortInfoResponseDTO {
    private PortNameDTO portNameDTO; // 국가명 항구명
    private int shipInPort; // 현재 정박수
    private int expectedShips; // 입항 예정 수
    private WeatherDTO weather; // 날씨 정보
    private String timezoneNow; // 현재 시각(UTC+0 기준)
    private String docking; // 혼잡, 적당, 여유로움

    public static PortInfoResponseDTO toDTO(
            PortNameDTO portNameDTO,
            PortDockingDTO dockingDTO,
            WeatherDTO weatherDTO,
            String timezoneNow,
            String docking) {
        return PortInfoResponseDTO.builder()
                .portNameDTO(portNameDTO)
                .shipInPort(dockingDTO.getShipsInPort())
                .expectedShips(dockingDTO.getExpectedShips())
                .weather(weatherDTO)
                .timezoneNow(timezoneNow)
                .docking(docking)
                .build();
    }

}
