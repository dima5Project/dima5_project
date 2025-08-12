package net.dima.dima5_project.controller;

import java.util.NoSuchElementException;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestClientException;

import lombok.RequiredArgsConstructor;
import net.dima.dima5_project.service.VesselService;

@RestController
@RequestMapping("/api/predict")           // 최종 경로: /api/predict
@RequiredArgsConstructor
public class PredictController {

    private final VesselService vesselService;  // ⬅️ PredictService 대신 VesselService 사용

    /**
     * 프론트에서 IMO 또는 MMSI로 호출
     * 예) GET /api/predict?imo=1234567
     *     GET /api/predict?mmsi=440123456
     * 반환: FastAPI의 JSON 문자열
     */
    @GetMapping
    public ResponseEntity<String> predict(
            @RequestParam(required = false) String imo,
            @RequestParam(required = false) String mmsi
    ) {
        try {
            // VesselService 내부에서:
            // 1) IMO/MMSI → vsl_id 조회
            // 2) FastAPI /predict_by_vsl 호출
            String resultJson = vesselService.predictByImoOrMmsi(imo, mmsi);
            return ResponseEntity.ok(resultJson);

        } catch (IllegalArgumentException e) {
            // 파라미터 검증 실패 (둘 다 없음 or 둘 다 있음 등)
            return ResponseEntity.badRequest().body(e.getMessage());

        } catch (NoSuchElementException e) {
            // vsl_id 조회 실패
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());

        } catch (RestClientException e) {
            // FastAPI 호출 실패
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                                .body("FastAPI call failed: " + e.getMessage());

        } catch (Exception e) {
            // 그 외 예외
            return ResponseEntity.internalServerError()
                                .body("Unexpected error: " + e.getMessage());
        }
    }
}
