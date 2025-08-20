package net.dima.dima5_project.service;

import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.dima.dima5_project.dto.PortCongestionSummary;
import net.dima.dima5_project.dto.PortDockingDTO;
import net.dima.dima5_project.entity.PortDockingEntity;
import net.dima.dima5_project.repository.PortDockingRepository;

// 정박 수 + 입항 예정 수
@Service
@RequiredArgsConstructor
@Slf4j
public class PortDockingService {

    private final PortDockingRepository portDockingRepository;

    public PortDockingDTO getLatestDockingInfo(String portId) {
        return portDockingRepository.findTopByPortIdOrderByTimeStampDesc(portId)
                .map(PortDockingDTO::toDTO)
                .orElseThrow(() -> {
                    log.warn("⚠️ 정박 정보 없음: portId={}", portId);
                    return new RuntimeException("정박 정보가 존재하지 않습니다.");
                });
    }

    public List<Map<String, Object>> getDockingGraphData(String portId) {
        List<PortDockingEntity> recentData = portDockingRepository.findTop5ByPortIdOrderByTimeStampDesc(portId);

        if (recentData.isEmpty()) {
            log.warn("⚠️ 그래프용 데이터 없음: portId={}", portId);
        }

        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("M/d");

        List<Map<String, Object>> result = new ArrayList<>();
        for (PortDockingEntity entity : recentData) {
            Map<String, Object> map = new HashMap<>();
            map.put("date", entity.getTimeStamp().format(formatter)); // 날짜 포맷 변경
            map.put("actual", entity.getCurrentShips());
            map.put("expected", entity.getExpectedShips());
            result.add(map);
        }

        Collections.reverse(result); // 최신 날짜가 오른쪽으로
        return result;
    }

    // 3) 현진 추가 코드
    public List<PortCongestionSummary> getAllPortCongestions() {
        // 1) 모든 항구의 최신 레코드
        List<PortDockingEntity> latest = portDockingRepository.findLatestForAllPorts();

        DateTimeFormatter iso = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss");

        // 2) 요약으로 매핑 (DTO의 혼잡도 계산 로직 재사용)
        List<PortCongestionSummary> out = new ArrayList<>(latest.size());
        for (PortDockingEntity e : latest) {
            PortDockingDTO dto = PortDockingDTO.toDTO(e); // ← 여기서 congestionLevel 계산됨

            PortCongestionSummary s = new PortCongestionSummary();
            s.setPortId(dto.getPortId());
            s.setCurrentShips(dto.getCurrentShips());
            s.setExpectedShips(dto.getExpectedShips());
            s.setCongestionLevel(dto.getCongestionLevel()); // ← 엔티티가 아니라 DTO에서 가져옴
            s.setUpdatedAt(e.getTimeStamp() != null ? e.getTimeStamp().format(iso) : null);

            out.add(s);
        }
        return out;
    }

}
