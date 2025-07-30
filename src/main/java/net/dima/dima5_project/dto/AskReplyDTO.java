package net.dima.dima5_project.dto;

import java.time.LocalDateTime;

import lombok.Builder;
import lombok.Data;
import net.dima.dima5_project.entity.AskBoardEntity;
import net.dima.dima5_project.entity.AskReplyEntity;

@Data
@Builder
public class AskReplyDTO {
    private Integer replyNum;
    private Long askBoardSeq;
    private String askTitle;
    private String replyContent;
    private LocalDateTime replyDate;

    // Entity → DTO 변환
    public static AskReplyDTO fromEntity(AskReplyEntity entity) {
        if (entity == null)
            return null;
        return AskReplyDTO.builder()
                .replyNum(entity.getReplyNum())
                .askBoardSeq(entity.getAskBoardSeq() != null ? entity.getAskBoardSeq().getAskSeq() : null)
                .askTitle(entity.getAskTitle())
                .replyContent(entity.getReplyContent())
                .replyDate(entity.getReplyDate())
                .build();
    }

    // DTO → Entity 변환 (askBoard는 외부에서 주입)
    public static AskReplyEntity toEntity(AskReplyDTO dto, AskBoardEntity askBoardEntity) {
        if (dto == null)
            return null;
        return AskReplyEntity.builder()
                .replyNum(dto.getReplyNum())
                .askBoardSeq(askBoardEntity) // FK → Entity 연결
                .askTitle(dto.getAskTitle())
                .replyContent(dto.getReplyContent())
                .replyDate(dto.getReplyDate())
                .build();
    }
}
