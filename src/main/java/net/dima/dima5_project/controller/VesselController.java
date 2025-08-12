package net.dima.dima5_project.controller;

import java.util.Optional;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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
     * 선박 검색 시, DB의 vsl_id 와 매핑하여 가져오기
     * @param type - IMO / MMSI 구분 선택
     * @param query- 사용자가 입력한 실제값 (IMO번호나 MMSI 번호)
     * @return
     */
    @GetMapping("/vessel-info")
    public ResponseEntity<String> getVesselInfo(
            @RequestParam String type, @RequestParam String query 
        ) {
        // type 정규화
        final String t = type == null ? "" : type.trim().toLowerCase();

        // vsl_id 조회 (Service에 findVslId(imo/mmsi 타입, 값) 구현되어 있어야 함)
        Optional<String> vslIdOpt = vesselService.findVslId(t, query);

        if (vslIdOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                                .body("선박을 찾을 수 없습니다.");
        }
        return ResponseEntity.ok(vslIdOpt.get());
    }

    /**
     * vsl_id 기준으로 최신 timepoint 조회
     * 예) GET /api/latest-timepoint?vslId=VSL-123
     */
    @GetMapping("/latest-timepoint")
    public ResponseEntity<?> getLatestTimepoint(@RequestParam String vslId) {
        // 서비스가 Optional<Integer>로 반환하도록 구현하면 안전
        return vesselService.getLatestTimepoint(vslId)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                                            .body("해당 vsl_id의 레코드가 없습니다."));
    }

}
