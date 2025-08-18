// src/main/java/net/dima/dima5_project/service/chat/ChatServiceImpl.java
package net.dima.dima5_project.service.chat;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

import net.dima.dima5_project.domain.chat.ChatMessage;
import net.dima.dima5_project.domain.chat.ChatRoom;
import net.dima.dima5_project.domain.chat.ChatRoomStatus;
import net.dima.dima5_project.domain.chat.SenderType;
import net.dima.dima5_project.dto.chat.ChatMsgDTO;
import net.dima.dima5_project.dto.chat.ChatRoomDTO;
import net.dima.dima5_project.entity.PredictUserEntity;
import net.dima.dima5_project.repository.UserRepository;
import net.dima.dima5_project.repository.chat.ChatMessageRepository;
import net.dima.dima5_project.repository.chat.ChatRoomRepository;

import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Service;
import org.springframework.web.context.request.RequestAttributes;
import org.springframework.web.context.request.RequestContextHolder;

@Service
@RequiredArgsConstructor
@Transactional
public class ChatServiceImpl implements ChatService {

    private final ChatRoomRepository roomRepo;
    private final ChatMessageRepository msgRepo;
    private final UserRepository userRepo;

    // ====== 유틸 ======
    private boolean isAdmin(Principal principal) {
        if (principal instanceof Authentication auth) {
            for (GrantedAuthority ga : auth.getAuthorities()) {
                if (Objects.equals(ga.getAuthority(), "ROLE_ADMIN"))
                    return true;
            }
        }
        return false;
    }

    private PredictUserEntity currentUser(Principal principal) {
        if (principal instanceof Authentication auth) {
            String userId = auth.getName(); // 로그인 사용자 userId
            if (userId != null) {
                return userRepo.findByUserId(userId).orElse(null);
            }
        }
        return null;
    }

    private String headerGuestId() {
        // ★ 1순위: STOMP에서 심어준 ThreadLocal
        String fromStomp = GuestContext.get();
        if (fromStomp != null && !fromStomp.isBlank())
            return fromStomp;

        // ★ 기존: HTTP 요청 헤더 (REST)
        try {
            var attrs = RequestContextHolder.getRequestAttributes();
            if (attrs == null)
                return null;
            var req = (jakarta.servlet.http.HttpServletRequest) attrs
                    .resolveReference(RequestAttributes.REFERENCE_REQUEST);
            if (req == null)
                return null;
            String v = req.getHeader("X-Guest-Id");
            return (v == null || v.isBlank()) ? null : v.trim();
        } catch (Exception e) {
            return null;
        }
    }

    private void authorizeRoomAccess(ChatRoom room, Principal principal) {
        if (room == null)
            throw new IllegalArgumentException("Room not found");
        // 관리자 통과
        if (isAdmin(principal))
            return;

        // 로그인 유저의 방?
        PredictUserEntity me = currentUser(principal);
        if (me != null && room.getUser() != null && Objects.equals(me.getUserSeq(), room.getUser().getUserSeq())) {
            return;
        }

        // 게스트의 방?
        String gid = headerGuestId();
        if (gid != null && gid.equals(room.getGuestId()))
            return;

        throw new SecurityException("Not owner of this room");
    }

    private static ChatMsgDTO toMsgDTO(ChatMessage m) {
        return new ChatMsgDTO(
                m.getId(),
                m.getRoom().getId(),
                m.getContent(),
                m.getSenderType().name(),
                m.getSender(),
                m.getCreatedAt().toString(),
                m.isReadByUser(),
                m.isReadByAdmin());
    }

    private ChatRoomDTO toRoomDTO(ChatRoom r) {
        String label = (r.getUser() != null) ? r.getUser().getUserId() : ("GUEST:" + r.getGuestId());
        long unread = msgRepo.countByRoomIdAndReadByAdminFalse(r.getId());
        var latest = msgRepo.findByRoomIdOrderByCreatedAtDesc(r.getId(), PageRequest.of(0, 1));
        String preview = latest.isEmpty() ? "" : truncate(latest.get(0).getContent(), 60);

        String lastAt = (r.getLastMsgAt() != null)
                ? r.getLastMsgAt().toString()
                : LocalDateTime.now().toString();

        return new ChatRoomDTO(
                r.getId(),
                r.getStatus().name(),
                label,
                preview,
                lastAt, // ← 여기만 변경!
                unread);
    }

    private static String truncate(String s, int n) {
        if (s == null)
            return "";
        s = s.trim();
        return s.length() <= n ? s : s.substring(0, n) + "…";
    }

    // ====== 구현 ======

    @Override
    public ChatRoomDTO openOrReuseRoom(Principal principal, String guestId) {
        PredictUserEntity me = currentUser(principal);
        ChatRoom room;

        if (me != null) {
            room = roomRepo.findFirstByUserAndStatusInOrderByLastMsgAtDesc(
                    me, List.of(ChatRoomStatus.OPEN, ChatRoomStatus.ASSIGNED)).orElseGet(() -> {
                        ChatRoom r = new ChatRoom();
                        r.setUser(me);
                        r.setStatus(ChatRoomStatus.OPEN);
                        r.setLastMsgAt(LocalDateTime.now()); // ★ 추가
                        return roomRepo.save(r);
                    });
        } else {
            String gid = (guestId == null || guestId.isBlank()) ? headerGuestId() : guestId;
            if (gid == null)
                throw new IllegalArgumentException("GuestId is required");
            room = roomRepo.findFirstByGuestIdAndStatusInOrderByLastMsgAtDesc(
                    gid, List.of(ChatRoomStatus.OPEN, ChatRoomStatus.ASSIGNED)).orElseGet(() -> {
                        ChatRoom r = new ChatRoom();
                        r.setGuestId(gid);
                        r.setStatus(ChatRoomStatus.OPEN);
                        r.setLastMsgAt(LocalDateTime.now()); // ★ 추가
                        return roomRepo.save(r);
                    });
        }

        return toRoomDTO(room);
    }

    @Override
    public ChatMsgDTO saveMessage(Long roomId, Principal principal, String content) {
        if (content == null || content.isBlank())
            throw new IllegalArgumentException("Empty content");

        ChatRoom room = roomRepo.findById(roomId).orElseThrow(() -> new IllegalArgumentException("Room not found"));
        authorizeRoomAccess(room, principal);

        boolean admin = isAdmin(principal);
        PredictUserEntity me = currentUser(principal);

        ChatMessage m = new ChatMessage();
        m.setRoom(room);
        if (admin) {
            m.setSenderType(SenderType.ADMIN);
            m.setSender(me != null ? me.getUserId() : "ADMIN");
            // 유저 미열람 플래그 초기화
            m.setReadByAdmin(true);
            m.setReadByUser(false);
            // 방 상태 자동 ASSIGNED
            if (room.getStatus() == ChatRoomStatus.OPEN)
                room.setStatus(ChatRoomStatus.ASSIGNED);
        } else {
            m.setSenderType(SenderType.USER);
            m.setSender(me != null ? me.getUserId() : "GUEST");
            m.setReadByAdmin(false);
            m.setReadByUser(true);
        }
        m.setContent(content.trim());
        m = msgRepo.save(m);

        room.setLastMsgAt(LocalDateTime.now());
        // updatedAt은 @PreUpdate로 커버

        return toMsgDTO(m);
    }

    @Override
    public void markRead(Long roomId, Principal principal) {
        ChatRoom room = roomRepo.findById(roomId).orElseThrow(() -> new IllegalArgumentException("Room not found"));
        authorizeRoomAccess(room, principal);

        boolean admin = isAdmin(principal);
        // 최근 N개만 조회해서 플래그 바꾸는 대신, JPA 벌크쿼리 없이 엔티티 업데이트로 단순 처리
        var page = PageRequest.of(0, 200);
        var list = msgRepo.findByRoomIdOrderByCreatedAtDesc(roomId, page);
        for (ChatMessage m : list) {
            if (admin) {
                if (!m.isReadByAdmin())
                    m.setReadByAdmin(true);
            } else {
                if (!m.isReadByUser())
                    m.setReadByUser(true);
            }
        }
        // flush는 트랜잭션 종료 시
    }

    @Override
    @Transactional(Transactional.TxType.SUPPORTS)
    public List<ChatMsgDTO> getHistory(Long roomId, int page, int size, Principal principal) {
        ChatRoom room = roomRepo.findById(roomId).orElseThrow(() -> new IllegalArgumentException("Room not found"));
        authorizeRoomAccess(room, principal);

        var list = msgRepo.findByRoomIdOrderByCreatedAtDesc(roomId, PageRequest.of(page, size));
        // 최신 내림차순으로 나가는데, 프론트에서 뒤집어 쓰고 싶으면 거기서 처리
        return list.stream().map(ChatServiceImpl::toMsgDTO).toList();
    }

    @Override
    @Transactional(Transactional.TxType.SUPPORTS)
    public List<ChatRoomDTO> listRooms(String status, int limit) {
        ChatRoomStatus st = ChatRoomStatus.valueOf(status.toUpperCase());
        return roomRepo.findByStatusOrderByLastMsgAtDesc(st).stream()
                .limit(Math.max(1, Math.min(limit, 500)))
                .map(this::toRoomDTO)
                .toList();
    }

    @Override
    @Transactional(Transactional.TxType.SUPPORTS)
    public ChatRoomDTO getRoomSummary(Long roomId) {
        ChatRoom r = roomRepo.findById(roomId).orElseThrow(() -> new IllegalArgumentException("Room not found"));
        return toRoomDTO(r);
    }

    @Override
    public void assign(Long roomId, Principal admin) {
        // if (!isAdmin(admin))
        // throw new SecurityException("Admin only");
        ChatRoom r = roomRepo.findById(roomId).orElseThrow(() -> new IllegalArgumentException("Room not found"));
        PredictUserEntity me = currentUser(admin);
        r.setAssignee(me);
        if (r.getStatus() == ChatRoomStatus.OPEN)
            r.setStatus(ChatRoomStatus.ASSIGNED);
    }

    @Override
    public void close(Long roomId) {
        ChatRoom r = roomRepo.findById(roomId).orElseThrow(() -> new IllegalArgumentException("Room not found"));
        r.setStatus(ChatRoomStatus.CLOSED);
    }

    @Override
    @Transactional(Transactional.TxType.SUPPORTS)
    public long unreadForAdmin(Long roomId) {
        return msgRepo.countByRoomIdAndReadByAdminFalse(roomId);
    }
}
