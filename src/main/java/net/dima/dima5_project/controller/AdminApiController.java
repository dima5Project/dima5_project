package net.dima.dima5_project.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import lombok.RequiredArgsConstructor;
import net.dima.dima5_project.dto.admin.AskBriefDTO;
import net.dima.dima5_project.dto.admin.UserTypeCountDTO;
import net.dima.dima5_project.dto.admin.WeeklySignupDTO;
import net.dima.dima5_project.repository.AskBoardRepository;
import net.dima.dima5_project.service.AdminStatService;
import net.dima.dima5_project.sse.SseEmitters;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminApiController {

    private final AdminStatService adminStatService;
    private final AskBoardRepository askBoardRepository;
    private final SseEmitters sseEmitters;

    // 도넛 차트 - 유형 관련
    @GetMapping("/usertype")
    public List<UserTypeCountDTO> userTypeCounts() {
        return adminStatService.getUserTypeCounts();
    }

    // 월별 가입자 수
    @GetMapping("/weekly")
    public List<WeeklySignupDTO> weeklySignups(@RequestParam(defaultValue = "12") int weeks) {
        return adminStatService.getWeeklySignups(weeks);
    }

    // 최근 문의 리스트
    @GetMapping("/recentask")
    public List<AskBriefDTO> recentAsks(@RequestParam(defaultValue = "20") int limit) {
        return adminStatService.getRecentAsks(limit);
    }

    // 실시간 문의 알림 (SSE)
    @GetMapping(value = "/asks/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamAsks() {
        SseEmitter emitter = sseEmitters.add();
        try {
            emitter.send(SseEmitter.event().name("init").data("connected"));
        } catch (Exception ignore) {
        }
        return emitter;
    }

    // 미답변 수
    @GetMapping("asks/unanswered-count")
    public Map<String, Object> unansweredCount() {
        long count = askBoardRepository.countByReplyStatusFalse();
        return Map.of("count", count);
    }

    /** 관리자 알림 SSE 스트림 */
    @GetMapping("/asks/stream")
    public SseEmitter stream() {
        return sseEmitters.addAndInit();
    }
}
