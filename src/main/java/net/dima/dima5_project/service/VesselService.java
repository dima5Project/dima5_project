package net.dima.dima5_project.service;

import java.util.Map;
import java.util.NoSuchElementException;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import lombok.RequiredArgsConstructor;
import net.dima.dima5_project.repository.VesselMasterRepository;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class VesselService {
    
    private final VesselMasterRepository vesselMasterRepository;
    private final RestTemplate restTemplate;

    // FastAPI 베이스 URL — 환경변수/설정파일로 분리 권장
    @Value("${fastapi.base-url:http://127.0.0.1:8000}")
    private String fastApiBaseUrl;

    /**
     * 1. IMO 또는 MMSI 중 하나를 받아서 vessel_master에서 vsl_id를 조회
     * 2. 그 vsl_id로 FastAPI의 /predict_by_vsl를 호출해 예측 결과(JSON 문자열) 를 그대로 반환
     * @param imo
     * @param mmsi
     * @return
     */
    public String predictByImoOrMmsi(String imo, String mmsi) {
        // 1) 입력 검증: 둘 중 하나만 허용
        if ((imo == null || imo.isBlank()) && (mmsi == null || mmsi.isBlank())) {
            throw new IllegalArgumentException("IMO or MMSI is required");
        }
        if ((imo != null && !imo.isBlank()) && (mmsi != null && !mmsi.isBlank())) {
            throw new IllegalArgumentException("Provide only one of IMO or MMSI");
        }

        // 2) vessel_master에서 vsl_id 조회
        String vslId = null;
        if (imo != null && !imo.isBlank()) {
            vslId = vesselMasterRepository.findVslIdByVslImo(imo)
                    .orElseThrow(() -> new NoSuchElementException("VSL_ID not found for IMO=" + imo));
        } else {
            vslId = vesselMasterRepository.findVslIdByVslMmsi(mmsi)
                    .orElseThrow(() -> new NoSuchElementException("VSL_ID not found for MMSI=" + mmsi));
        }

        // 3) FastAPI 호출: /predict_by_vsl?vsl_id=...&basis=time_point
        String url = UriComponentsBuilder
                .fromHttpUrl(fastApiBaseUrl)
                .path("/predict_by_vsl")
                .queryParam("vsl_id", vslId)
                .queryParam("basis", "time_point") // 또는 "time_stamp"
                .build()
                .toUriString();

        // 4) FastAPI 응답(JSON 문자열) 그대로 반환(또는 DTO로 매핑)
        return restTemplate.getForObject(url, String.class);
    }

    /**
     * 선박 검색: type = "imo" | "mmsi", query = 실제 값
     * - vsl_id가 있으면 Optional로 반환, 없으면 Optional.empty()
     */
    public Optional<String> findVslId(String type, String query) {
        if (query == null || query.isBlank()) return Optional.empty();

        final String q = query.trim();
        final String t = (type == null) ? "" : type.trim().toLowerCase();

        return switch (t) {
            case "imo"  -> vesselMasterRepository.findVslIdByVslImo(q);
            case "mmsi" -> vesselMasterRepository.findVslIdByVslMmsi(q);
            default     -> Optional.empty();
        };
    }

    /**
     * 해당 vsl_id로 최신 timepoint 조회
     * - 별도 DB 쿼리가 없다면, FastAPI의 /predict_by_vsl 호출 응답에서 matched_row.time_point를 사용
     */
    public Optional<Integer> getLatestTimepoint(String vslId) {
        if (vslId == null || vslId.isBlank()) return Optional.empty();

        final String url = UriComponentsBuilder
                .fromHttpUrl(fastApiBaseUrl)
                .path("/predict_by_vsl")
                .queryParam("vsl_id", vslId)
                .queryParam("basis", "time_point") // time_point 최대값 기준
                .toUriString();

        try {
            // FastAPI 응답(JSON 문자열)을 Map으로 받아 파싱
            ResponseEntity<Map> resp = restTemplate.getForEntity(url, Map.class);
            if (!resp.getStatusCode().is2xxSuccessful() || resp.getBody() == null) {
                return Optional.empty();
            }
            Map<?, ?> body = resp.getBody();
            Object matchedRowObj = body.get("matched_row");
            if (!(matchedRowObj instanceof Map<?, ?> matched)) return Optional.empty();

            Object tpObj = matched.get("time_point");
            if (tpObj == null) return Optional.empty();

            // FastAPI는 float로 내려줄 수 있으므로 숫자 변환 처리
            if (tpObj instanceof Number n) {
                return Optional.of(n.intValue());
            }
            try {
                return Optional.of(Integer.parseInt(tpObj.toString()));
            } catch (NumberFormatException e) {
                return Optional.empty();
            }
        } catch (RestClientException e) {
            // FastAPI가 내려가 있거나 네트워크 오류
            return Optional.empty();
        }
    }
}
