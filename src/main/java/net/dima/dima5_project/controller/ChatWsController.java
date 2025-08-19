package net.dima.dima5_project.controller;

import java.security.Principal;
import java.util.Map;

import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import lombok.RequiredArgsConstructor;
import net.dima.dima5_project.dto.chat.ChatMsgDTO;
import net.dima.dima5_project.service.chat.ChatService;
import net.dima.dima5_project.service.chat.GuestContext;

@Controller
@RequiredArgsConstructor
public class ChatWsController {

    private final ChatService chatService;
    private final SimpMessagingTemplate messaging;

    // 방 목록/미읽음 갱신 신호 (payload는 아무거나 OK)
    private void pushRoomsTick(Long roomId) {
        messaging.convertAndSend("/topic/chat.rooms",
                Map.of("type", "ROOMS_TICK", "roomId", roomId));
    }

    /** 클라이언트 -> /app/chat.send.{roomId} */
    @MessageMapping("/chat.send.{roomId}")
    public void send(@DestinationVariable Long roomId,
            @Payload Map<String, Object> payload,
            @Header(name = "X-Guest-Id", required = false) String guestId,
            Principal principal) {
        String content = String.valueOf(payload.get("content"));
        try {
            GuestContext.set(guestId);
            ChatMsgDTO dto = chatService.saveMessage(roomId, principal, content);

            // 1) 채팅방으로 실제 메시지 브로드캐스트
            messaging.convertAndSend("/topic/chat." + roomId, dto);

            // 2) 방 목록 갱신 신호
            pushRoomsTick(roomId); // ★ 여기만 호출
        } finally {
            GuestContext.clear();
        }
        // 여기까지 오면 프론트에서 rooms 토픽 구독 중이면 목록이 즉시 새로고침됨
    }

    /** 읽음 동기화: 클라 -> /app/chat.read.{roomId} */
    @MessageMapping("/chat.read.{roomId}")
    public void read(@DestinationVariable Long roomId,
            @Header(name = "X-Guest-Id", required = false) String guestId,
            Principal principal) {
        try {
            GuestContext.set(guestId);
            chatService.markRead(roomId, principal);

            // 방 내부엔 READ_SYNC 신호(선택 사항)
            messaging.convertAndSend("/topic/chat." + roomId,
                    Map.of("type", "READ_SYNC", "roomId", roomId));

            // 방 목록 갱신 신호
            pushRoomsTick(roomId); // ★ 여기만 호출
        } finally {
            GuestContext.clear();
        }
    }
}
