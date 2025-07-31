package net.dima.dima5_project.dto;

import java.time.LocalDateTime;

import lombok.Builder;
import lombok.Data;
import net.dima.dima5_project.entity.AskBoardEntity;
import net.dima.dima5_project.entity.AskReplyEntity;

@Data
@Builder
public class AskReplyDTO {

    private Long askSeq;
    private String replyContent;
    private LocalDateTime replyDate;

    /**
     * toEntity 메서드란?
     * → Entity → DTO 변환 메서드
     * 
     * @param dto
     * @param askBoardEntity
     * @return
     */
    public static AskReplyEntity toEntity(AskReplyDTO dto, AskBoardEntity askBoardEntity) {
        if (dto == null)
            return null;
        return AskReplyEntity.builder()
                .askSeq(dto.getAskSeq())
                .askBoard(askBoardEntity)
                .replyContent(dto.getReplyContent())
                .replyDate(dto.getReplyDate())
                .build();
    }
}
