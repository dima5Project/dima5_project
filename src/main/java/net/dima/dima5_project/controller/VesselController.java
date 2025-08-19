package net.dima.dima5_project.controller;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;
import net.dima.dima5_project.service.VesselService;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class VesselController {

    private final VesselService vesselService;
    
    /**
     * 예:
     *  - /api/predict?imo=9121041
     *  - /api/predict?mmsi=441107000
     * 둘 다 오면 서비스에서 IMO 우선 처리
     */
    @GetMapping("/predict")
    public ResponseEntity<Map<String, Object>> predict(
            @RequestParam(required = false) String imo,
            @RequestParam(required = false) String mmsi
    ) {
        // 서비스: (imo, mmsi) -> vsl_id 조회 -> FastAPI 호출 -> Map 반환
        Map<String, Object> result = vesselService.predictByImoOrMmsi(imo, mmsi);

        // 에러 키가 있으면 적절한 HTTP 상태코드로 매핑
        HttpStatus status = HttpStatus.OK;
        Object err = result.get("error");
        if (err instanceof String e) {
            switch (e) {
                case "BAD_REQUEST" -> status = HttpStatus.BAD_REQUEST; // imo/mmsi 모두 없음 등
                case "NOT_FOUND"   -> status = HttpStatus.NOT_FOUND;   // DB에 매칭 vsl_id 없음
                case "CLIENT_EXCEPTION" -> status = HttpStatus.BAD_GATEWAY; // 네트워크 등 클라이언트 예외
                default -> {
                    // "HTTP_404", "HTTP_500" 형태면 숫자 코드로 변환
                    if (e.startsWith("HTTP_")) {
                        try {
                            int code = Integer.parseInt(e.substring("HTTP_".length()));
                            HttpStatus parsed = HttpStatus.resolve(code);
                            status = (parsed != null) ? parsed : HttpStatus.BAD_GATEWAY;
                        } catch (NumberFormatException ignore) {
                            status = HttpStatus.BAD_GATEWAY;
                        }
                    } else {
                        status = HttpStatus.BAD_GATEWAY;
                    }
                }
            }
        }

        return new ResponseEntity<>(result, status);
    }

}