
package net.dima.dima5_project.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.dima.dima5_project.repository.VesselMasterRepository;

import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@Slf4j
public class VesselService {

    private final VesselMasterRepository vesselMasterRepository;
    private final RestTemplate restTemplate;

    /** 이미 있는 메서드 — type: "imo" | "mmsi" */
    public Optional<String> findVslId(String type, String query) {
        if (query == null || query.isBlank())
            return Optional.empty();
        final String q = query.trim();
        final String t = (type == null) ? "" : type.trim().toLowerCase();

        Optional<String> vslId = switch (t) {
            case "imo" -> vesselMasterRepository.findVslIdByVslImo(q);
            case "mmsi" -> vesselMasterRepository.findVslIdByVslMmsi(q);
            default -> Optional.empty();
        };

        vslId.ifPresent(id -> log.info("Found vsl_id = {}", id));
        return vslId;
    }

    /**
     * FastAPI 연결하여 특정 imo/mmsi 에 해당하는 선박의 예측 결과 가져오기
     * 
     * @param imo
     * @param mmsi
     * @return
     */
    // @Bean
    public Map<String, Object> predictByImoOrMmsi(String imo, String mmsi) {
        // 1) 입력 정리
        String IMO = (imo == null || imo.isBlank()) ? null : imo.trim();
        String MMSI = (mmsi == null || mmsi.isBlank()) ? null : mmsi.trim();

        if (IMO == null && MMSI == null) {
            return Map.of("error", "BAD_REQUEST", "detail", "imo나 mmsi 중 하나는 반드시 필요합니다.");
        }

        // 2) DB에서 vsl_id 조회
        Optional<String> vslIdOpt = (IMO != null)
                ? vesselMasterRepository.findVslIdByVslImo(IMO)
                : vesselMasterRepository.findVslIdByVslMmsi(MMSI);

        if (vslIdOpt.isEmpty()) {
            return Map.of(
                    "error", "NOT_FOUND",
                    "detail",
                    (IMO != null) ? ("IMO=" + IMO + " 로 vsl_id가 없습니다.") : ("MMSI=" + MMSI + " 로 vsl_id가 없습니다."));
        }

        String vslId = vslIdOpt.get();
        log.info("Found vsl_id = {}", vslId);

        // 3) FastAPI 호출
        try {
            URI uri = UriComponentsBuilder
                    .fromUriString("https://dima5-fastapi.onrender.com/predict_map_by_vsl")
                    .queryParam("vsl_id", vslId)
                    .build(true)
                    .toUri();

            HttpHeaders headers = new HttpHeaders();
            headers.setAccept(List.of(MediaType.APPLICATION_JSON));
            HttpEntity<Void> req = new HttpEntity<>(headers);

            ResponseEntity<Map<String, Object>> resp = restTemplate.exchange(
                    uri, HttpMethod.GET, req,
                    new ParameterizedTypeReference<Map<String, Object>>() {
                    });

            Map<String, Object> body = resp.getBody();
            log.info("FastAPI status = {}", resp.getStatusCode());
            log.info("FastAPI response (Map) = {}", body);
            return (body != null) ? body : Map.of("error", "EMPTY_RESPONSE");

        } catch (HttpStatusCodeException e) {
            // FastAPI가 4xx/5xx 응답을 준 경우
            log.error("FastAPI error {} {}", e.getStatusCode(), e.getResponseBodyAsString());
            return Map.of(
                    "error", "HTTP_" + e.getStatusCode().value(),
                    "detail", e.getResponseBodyAsString());
        } catch (RestClientException e) {
            // 연결 실패 등 클라이언트 에러
            log.error("FastAPI call failed: {}", e.getMessage(), e);
            return Map.of(
                    "error", "CLIENT_EXCEPTION",
                    "detail", e.getMessage());
        } catch (Exception e) {
            log.error("Unexpected error", e);
            return Map.of("error", "INTERNAL");
        }
    }

}
