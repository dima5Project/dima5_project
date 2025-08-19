package net.dima.dima5_project.controller;

import java.security.Principal;
import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate; // ★ 추가
import org.springframework.web.bind.annotation.*;

import lombok.RequiredArgsConstructor;
import net.dima.dima5_project.dto.chat.ChatMsgDTO;
import net.dima.dima5_project.dto.chat.ChatRoomDTO;
import net.dima.dima5_project.service.chat.ChatService;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatApiController {
    private final ChatService chatService;
    private final SimpMessagingTemplate messaging; // ★ 추가

    /** 사용자: 방 열기(또는 기존 방 재사용) - 게스트면 X-Guest-Id 헤더로 식별 */
    @PostMapping("/room/open")
    public ChatRoomDTO openRoom(
            @RequestHeader(value = "X-Guest-Id", required = false) String guestId,
            Principal principal) {

        ChatRoomDTO dto = chatService.openOrReuseRoom(principal, guestId);

        // (선택) 새 방이 생성되었거나 최근 활성화가 바뀐 경우 목록 갱신 신호
        messaging.convertAndSend("/topic/chat.rooms",
                Map.of("type", "ROOMS_TICK", "roomId", dto.id())); // ★ 추가

        return dto;
    }

    /** 방 메시지 이력 조회 (최신순/페이지) */
    @GetMapping("/room/{roomId}/messages")
    public List<ChatMsgDTO> history(@PathVariable Long roomId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            @RequestHeader(value = "X-Guest-Id", required = false) String guestId,
            Principal principal) {
        return chatService.getHistory(roomId, page, size, principal);
    }

    // ===== 관리자 영역 =====

    /** 관리자: 방 목록(상태/미응답 우선 정렬) */
    @GetMapping("/admin/rooms")
    public List<ChatRoomDTO> rooms(@RequestParam(defaultValue = "OPEN") String status,
            @RequestParam(defaultValue = "50") int limit) {
        return chatService.listRooms(status, limit);
    }

    /** 관리자: 방 배정 */
    @PostMapping("/admin/rooms/{roomId}/assign")
    public Map<String, Object> assign(@PathVariable Long roomId, Principal admin) {
        chatService.assign(roomId, admin);

        // 방 목록 갱신 신호 브로드캐스트 ★ 추가
        messaging.convertAndSend("/topic/chat.rooms",
                Map.of("type", "ROOMS_TICK", "roomId", roomId));

        return Map.of("ok", true);
    }

    /** 관리자: 방 종료 */
    @PostMapping("/admin/rooms/{roomId}/close")
    public Map<String, Object> close(@PathVariable Long roomId) {
        chatService.close(roomId);

        // 방 목록 갱신 신호 브로드캐스트 ★ 추가
        messaging.convertAndSend("/topic/chat.rooms",
                Map.of("type", "ROOMS_TICK", "roomId", roomId));

        return Map.of("ok", true);
    }

    /** 관리자: 특정 방의 미응답 수(선택) */
    @GetMapping("/admin/rooms/{roomId}/unread")
    public ResponseEntity<Map<String, Long>> unread(@PathVariable Long roomId) {
        long cnt = chatService.unreadForAdmin(roomId);
        return ResponseEntity.ok(Map.of("count", cnt));
    }
}
