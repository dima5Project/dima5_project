package net.dima.dima5_project.dto.chat;

public record ChatMsgDTO(
                Long id,
                Long roomId,
                String content,
                String senderType, // USER / ADMIN
                String sender, // userId 또는 adminId
                String createdAt, // ISO 문자열 or yyyy-MM-dd HH:mm
                boolean readByUser,
                boolean readByAdmin) {
}