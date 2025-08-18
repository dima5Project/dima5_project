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

    /**
     * 클라이언트 -> app/chat.send.{roomID}
     * 
     */
    @MessageMapping("/chat.send.{roomId}")
    public void send(@DestinationVariable Long roomId,
            @Payload Map<String, Object> payload,
            @Header(name = "X-Guest-Id", required = false) String guestId,
            Principal principal) {
        String content = String.valueOf(payload.get("content"));
        try {
            GuestContext.set(guestId); // ★ STOMP 컨텍스트 주입
            ChatMsgDTO dto = chatService.saveMessage(roomId, principal, content);
            messaging.convertAndSend("/topic/chat." + roomId, dto);
        } finally {
            GuestContext.clear();
        }
    }

    /**
     * 읽음 동기화: 클라이언트 -> /app/chat.read.{roodId}
     */
    @MessageMapping("/chat.read.{roomId}")
    public void read(@DestinationVariable Long roomId,
            @Header(name = "X-Guest-Id", required = false) String guestId,
            Principal principal) {
        try {
            GuestContext.set(guestId); // ★ 읽음 처리도 동일
            chatService.markRead(roomId, principal);
            messaging.convertAndSend("/topic/chat." + roomId,
                    Map.of("type", "READ_SYNC", "roomId", roomId));
        } finally {
            GuestContext.clear();
        }
    }
}
