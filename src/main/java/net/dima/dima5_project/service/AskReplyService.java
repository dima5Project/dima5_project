package net.dima.dima5_project.service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;
import net.dima.dima5_project.dto.AskReplyDTO;
import net.dima.dima5_project.entity.AskBoardEntity;
import net.dima.dima5_project.entity.AskReplyEntity;
import net.dima.dima5_project.repository.AskBoardRepository;
import net.dima.dima5_project.repository.AskReplyRepository;
import net.dima.dima5_project.sse.SseEmitters;

@Service
@RequiredArgsConstructor
@Transactional
public class AskReplyService {

    private final AskBoardRepository askBoardRepository;
    private final AskReplyRepository askReplyRepository;
    private final SseEmitters sseEmitters;

    public AskReplyDTO addOrUpdateReply(Long askSeq, AskReplyDTO dto) {
        // 1) 원글
        AskBoardEntity board = askBoardRepository.findById(askSeq)
                .orElseThrow(() -> new IllegalArgumentException("문의글을 찾을 수 없습니다: " + askSeq));

        // 2) 기존/신규
        AskReplyEntity reply = askReplyRepository.findById(askSeq).orElse(null);
        if (reply == null) {
            reply = new AskReplyEntity();
            reply.setReplyNum(board.getAskSeq()); // PK=FK
            reply.set_isNew(true); // ★★★ 신규 저장은 persist로!
        }

        // ★★★ PK(=FK) 꼭 세팅! (null이면 merge 시 바로 터집니다)
        reply.setReplyNum(board.getAskSeq()); // == askSeq
        // ★★★ 연관도 반드시 연결
        reply.setAskBoard(board);

        // 3) 내용 채우기
        String title = (dto.getAskTitle() != null && !dto.getAskTitle().isBlank())
                ? dto.getAskTitle()
                : board.getAskTitle();

        reply.setAskTitle(title);
        reply.setReplyContent(dto.getReplyContent() != null ? dto.getReplyContent() : ""); // DB NOT NULL이면 빈문자라도 넣기
        reply.setReplyDate(dto.getReplyDate() != null ? dto.getReplyDate() : LocalDateTime.now());

        // 4) 저장
        AskReplyEntity saved = askReplyRepository.save(reply); // saveAndFlush(...)여도 OK

        // 5) 원글 상태 ON
        if (board.getReplyStatus() == null || !board.getReplyStatus()) {
            board.setReplyStatus(true);
            // askBoardRepository.save(board); //<- 없어도 dirty checking으로 반영됨
        }

        // 6) SSE (선택)
        Map<String, Object> payload = new HashMap<>();
        payload.put("askSeq", board.getAskSeq());
        payload.put("title", board.getAskTitle());
        String writerLabel = "";
        if (board.getWriter() != null) {
            String nm = board.getWriter().getUserName();
            String id = board.getWriter().getUserId();
            writerLabel = (nm != null && !nm.isBlank()) ? nm : (id != null ? id : "");
        }
        payload.put("writer", writerLabel);
        payload.put("replyDate", saved.getReplyDate());
        sseEmitters.send("ask-replied", payload);

        return AskReplyDTO.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public AskReplyDTO getReplyDTO(Long askSeq) {
        return askReplyRepository.findById(askSeq)
                .map(AskReplyDTO::fromEntity)
                .orElse(null);
    }

    public void deleteReply(Long askSeq) {
        askReplyRepository.deleteById(askSeq);
        askBoardRepository.findById(askSeq).ifPresent(b -> {
            b.setReplyStatus(false);
            askBoardRepository.save(b);
            sseEmitters.send("ask-replied", Map.of("askSeq", askSeq, "replyDeleted", true));
        });
    }
}
