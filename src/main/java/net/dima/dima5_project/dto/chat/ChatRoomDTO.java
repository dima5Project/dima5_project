package net.dima.dima5_project.dto.chat;

public record ChatRoomDTO(
        Long id,
        String status, // OPEN / ASSIGNED / CLOSED
        String userLabel, // 유저 아이디 또는 게스트 ID
        String lastMessagePreview, // 마지막 메시지 요약
        String lastAt, // 마지막 메시지 시간
        Long unreadForAdmin // 관리자가 안 읽은 개수
) {
}
