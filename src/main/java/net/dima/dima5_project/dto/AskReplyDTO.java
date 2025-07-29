package net.dima.dima5_project.dto;

import java.time.LocalDateTime;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AskReplyDTO {
    private Integer replyNum;
    private String askTitle;
    private String replyContent;
    private LocalDateTime replyDate;

    // public static AskReplyDTO toDTO(AskReplyEntity askReplyEntity) {
    // return AskReplyDTO.builder()
    // .replyNum(askReplyEntity.getReplyNum())
    // .askTitle(askReplyEntity.getAskTitle())
    // .replyContent(askReplyEntity.getReplyContent())
    // .replyDate(askReplyEntity.getReplyDate())
    // .build();
    // }
}
