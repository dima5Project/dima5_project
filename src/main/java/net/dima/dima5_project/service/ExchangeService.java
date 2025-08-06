package net.dima.dima5_project.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.dima.dima5_project.dto.PortInfoResponseDTO.ExchangeDTO;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;

@Service
@Slf4j
@RequiredArgsConstructor
public class ExchangeService {

    private static final String API_URL = "https://api.frankfurter.app/latest";
    private static final String BASE = "USD";
    private static final String[] SYMBOLS = { "USD", "HKD", "JPY", "CNY", "RUB", "VND", "PHP", "TWD" };

    public List<ExchangeDTO> getExchangeInfoList() {
        RestTemplate restTemplate = new RestTemplate();

        // symbols 파라미터 구성
        String symbolsParam = String.join(",", SYMBOLS);

        // URL 완성
        String url = String.format("%s?base=%s&symbols=%s", API_URL, BASE, symbolsParam);
        log.info("📌 Frankfurter API 호출: {}", url);

        try {
            // API 응답 받기
            ResponseEntity<Map> response = restTemplate.getForEntity(url, Map.class);
            Map<String, Object> responseBody = response.getBody();

            String date = (String) responseBody.get("date");
            Map<String, Double> rates = (Map<String, Double>) responseBody.get("rates");

            // DTO 리스트 구성
            List<ExchangeDTO> result = new ArrayList<>();

            for (String currency : SYMBOLS) {
                Double rate = rates.get(currency);
                if (rate == null)
                    continue;

                ExchangeDTO dto = new ExchangeDTO();
                dto.setCurrency(currency);
                dto.setCurrencyName(getCurrencyName(currency)); // 필요 시 한글명 매핑
                dto.setCurrentTime(date);
                dto.setBaseRate(String.valueOf(rate));
                dto.setExchangeRateChange("정보 없음");
                dto.setBuyRate("정보 없음");
                dto.setSellRate("정보 없음");

                result.add(dto);
            }

            return result;
        } catch (Exception e) {
            log.error("❌ Frankfurter API 호출 중 오류 발생", e);
            return Collections.emptyList();
        }
    }

    private String getCurrencyName(String code) {
        return switch (code) {
            case "USD" -> "미국 달러";
            case "HKD" -> "홍콩 달러";
            case "JPY" -> "일본 엔";
            case "CNY" -> "중국 위안";
            case "RUB" -> "러시아 루블";
            case "VND" -> "베트남 동";
            case "PHP" -> "필리핀 페소";
            case "TWD" -> "대만 달러";
            default -> code;
        };
    }
}
