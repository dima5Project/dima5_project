package net.dima.dima5_project.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import lombok.RequiredArgsConstructor;
import net.dima.dima5_project.dto.AskReplyDTO;
import net.dima.dima5_project.entity.AskReplyEntity;
import net.dima.dima5_project.repository.AdminNoticeRepository;
import net.dima.dima5_project.repository.AskBoardRepository;
import net.dima.dima5_project.service.AskReplyService;

@RestController
@RequestMapping("/api/admin/asks")
@RequiredArgsConstructor
public class AdminAskReplyController {

    private final AskReplyService askReplyService;
    private final AdminNoticeRepository noticeRepo;
    private final AskBoardRepository askBoardRepository;

    /** 답글 등록/수정(업서트) */
    @PostMapping("/{askSeq}/reply")
    public ResponseEntity<?> addOrUpdate(@PathVariable Long askSeq, @RequestBody AskReplyDTO dto) {
        AskReplyDTO saved = askReplyService.addOrUpdateReply(askSeq, dto);
        // 서비스에서 reply_status true로 세팅됨
        return ResponseEntity.ok(Map.of(
                "ok", true,
                "reply", saved,
                "replyStatus", true // 프론트 즉시 토글용
        ));
    }

    /** 답글 단건 조회 */
    @GetMapping("/{askSeq}/reply")
    public ResponseEntity<?> get(@PathVariable Long askSeq) {
        return ResponseEntity.ok(askReplyService.getReplyDTO(askSeq));
    }

    /** 답글 삭제 */
    @DeleteMapping("/{askSeq}/reply")
    public ResponseEntity<?> delete(@PathVariable Long askSeq) {
        askReplyService.deleteReply(askSeq);
        return ResponseEntity.ok(Map.of("ok", true));
    }

    /** 문의 상세 + 답변(있으면) — askreply.js 에서 사용 */
    @GetMapping("/{askSeq}")
    public ResponseEntity<?> getAsk(@PathVariable Long askSeq) {
        return askBoardRepository.findById(askSeq)
                .map(ask -> {
                    AskReplyEntity r = ask.getReply();
                    Map<String, Object> body = new HashMap<>();
                    body.put("askSeq", ask.getAskSeq());
                    body.put("title", ask.getAskTitle());
                    body.put("content", ask.getAskContent());
                    body.put("writer", ask.getWriter() != null ? ask.getWriter().getUserId() : "");
                    body.put("createdAt", ask.getCreateDate());
                    body.put("replyStatus", Boolean.TRUE.equals(ask.getReplyStatus())); // ← 상태 포함
                    body.put("reply", (r == null) ? null
                            : Map.of(
                                    "content", r.getReplyContent(),
                                    "createdAt", r.getReplyDate()));
                    return ResponseEntity.ok(body);
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    /** 최근 문의 목록 (대시보드 패널) */
    @GetMapping("/recent")
    public List<Map<String, Object>> recent(@RequestParam(defaultValue = "20") int limit) {
        return askBoardRepository.findRecent(PageRequest.of(0, Math.min(limit, 200)))
                .map(a -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("askSeq", a.getAskSeq());
                    m.put("title", a.getAskTitle());
                    m.put("writer", a.getWriter() != null ? a.getWriter().getUserId() : "");
                    m.put("createdAt", a.getCreateDate());
                    m.put("replyStatus", Boolean.TRUE.equals(a.getReplyStatus())); // ← 뱃지용
                    return m;
                })
                .getContent();
    }

    /** 미답변 문의 목록 (필터 패널) */
    @GetMapping("/unanswered")
    public List<Map<String, Object>> unanswered(@RequestParam(defaultValue = "50") int limit) {
        return askBoardRepository.findByReplyStatusFalse(PageRequest.of(0, Math.min(limit, 200)))
                .map(a -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("askSeq", a.getAskSeq());
                    m.put("title", a.getAskTitle());
                    m.put("writer", a.getWriter() != null ? a.getWriter().getUserId() : "");
                    m.put("createdAt", a.getCreateDate());
                    m.put("replyStatus", false);
                    return m;
                })
                .getContent();
    }

    /** 로그 목록 (기존) */
    @GetMapping("/log")
    public List<Map<String, Object>> getLog(@RequestParam(defaultValue = "100") int limit) {
        return noticeRepo.findRecent(PageRequest.of(0, Math.min(limit, 500)))
                .stream()
                .map(n -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("id", n.getId());
                    m.put("eventType", n.getEventType()); // '신규' / '답변완료'
                    m.put("askSeq", n.getAskSeq());
                    m.put("title", n.getTitle());
                    m.put("writer", n.getWriter());
                    m.put("createdAt", n.getCreatedAt());
                    m.put("read", Boolean.TRUE.equals(n.getIsRead()));
                    return m;
                })
                .toList();
    }

    /** 로그 읽음 처리 */
    @PatchMapping("/log/{id}/read")
    public ResponseEntity<?> markRead(@PathVariable Long id) {
        noticeRepo.findById(id).ifPresent(n -> {
            n.setIsRead(true);
            noticeRepo.save(n);
        });
        return ResponseEntity.ok(Map.of("ok", true));
    }

    /** 미답변 수 (헤더 빨간 점) */
    @GetMapping("/unanswered-counts")
    public Map<String, Long> unansweredCount() {
        long count = askBoardRepository.countByReplyStatusFalse();
        return Map.of("count", count);
    }
}
