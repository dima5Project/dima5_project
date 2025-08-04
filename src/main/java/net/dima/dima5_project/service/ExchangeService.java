package net.dima.dima5_project.service;

import java.util.ArrayList;
import java.util.List;

import org.json.JSONArray;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import lombok.RequiredArgsConstructor;
import net.dima.dima5_project.dto.PortInfoResponseDTO.ExchangeDTO;

@Service
@RequiredArgsConstructor
public class ExchangeService {

    @Value("${exchange.api.url}")
    private String apiUrl;

    @Value("${exchange.api.authkey}")
    private String apiKey;

    private final RestTemplate restTemplate = new RestTemplate();

    private final List<String> targetCurrencies = List.of(
            "USD", "HKD", "JPY(100)", "CNH", "RUB", "VND", "PHP", "TWD");

    public List<ExchangeDTO> getExchangeInfoList() {
        String url = apiUrl + "?authkey=" + apiKey + "&data=AP01";

        List<ExchangeDTO> resultList = new ArrayList<>();

        try {
            // User-Agent 헤더 설정
            HttpHeaders headers = new HttpHeaders();
            headers.set("User-Agent", "Mozilla/5.0");
            HttpEntity<String> entity = new HttpEntity<>(headers);

            // exchange()를 사용해 API 호출
            ResponseEntity<String> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    entity,
                    String.class);

            String json = response.getBody();
            JSONArray jsonArr = new JSONArray(json);

            for (int i = 0; i < jsonArr.length(); i++) {
                JSONObject obj = jsonArr.getJSONObject(i);
                String curUnit = obj.getString("cur_unit");

                if (targetCurrencies.contains(curUnit)) {
                    resultList.add(new ExchangeDTO(
                            curUnit,
                            obj.getString("cur_nm"), // 통화 이름
                            obj.getString("date"), // 기준 시각
                            obj.getString("deal_bas_r"), // 기준 환율
                            obj.getString("sign") + obj.getString("chnge"), // 전일 대비
                            obj.getString("tts"), // 살 때 (고객이 사는 가격)
                            obj.getString("ttb") // 팔 때 (고객이 파는 가격)
                    ));
                }
            }

        } catch (Exception e) {
            e.printStackTrace();
        }

        return resultList;
    }
}