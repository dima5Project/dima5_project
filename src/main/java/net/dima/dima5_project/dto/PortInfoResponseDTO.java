package net.dima.dima5_project.dto;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class PortInfoResponseDTO {
    private PortNameDTO portNameInfo;

    private int shipsInPort; // 접안 수
    private int expectedShips; // 입항 예정 수

    private List<ExchangeDTO> exchanges; // 여러 국가 통화에 대한 환율 리스트
    private WeatherDTO weather; // 날씨 정보

    private double locLat;
    private double locLon;

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class ExchangeDTO {
        private String currency; // 통화코드 (예: USD)
        private String currencyName; // 통화명 (예: 미국 달러)
        private String currentTime; // 기준 시각
        private String baseRate; // 기준 환율 (deal_bas_r)
        private String exchangeRateChange; // 전일 대비 (sign + chnge)
        private String buyRate; // TTS (팔 때, 고객이 살 때)
        private String sellRate; // TTB (살 때, 고객이 팔 때)
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class WeatherDTO {
        private String portName; // 항구 이름
        // private String portCd; // 항구 이름 둘 중 하나
        private String temperature;
        private String icon; // 예: "10d" (이미지 URL로 활용 가능)
    }
}
