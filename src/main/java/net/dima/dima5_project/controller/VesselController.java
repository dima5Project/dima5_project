package net.dima.dima5_project.controller;

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
    @GetMapping("/api/vessel-info")
    public String getVesselInfo(@RequestParam String type, @RequestParam String query) {
        return vesselService.findVslId(type, query)
                            .orElse("선박을 찾을 수 없습니다.");
    }

    /**
     * DB에서 항구별 선박별 timestamp가 가장 최신인 행의 timepoint 바로 조회
     * @param vslId
     * @return
     */
    @GetMapping("/latest-timepoint")
    public ResponseEntity<Integer> getLatestTimepoint(@RequestParam String vslId) {
        Integer timepoint = vesselService.getLatestTimepoint(vslId);
        return ResponseEntity.ok(timepoint);
    }

}
