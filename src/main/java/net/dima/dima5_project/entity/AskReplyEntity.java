package net.dima.dima5_project.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import net.dima.dima5_project.dto.AskReplyDTO;

@Entity
@Table(name = "ask_reply")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AskReplyEntity {

    @Id
    @Column(name = "reply_num")
    private Integer replyNum;

    @OneToOne
    @JoinColumn(name = "reply_num", referencedColumnName = "ask_seq")
    private AskBoardEntity askBoard;

    @Column(name = "ask_title")
    private String askTitle;

    @Column(name = "reply_content")
    private String replyContent;

    @Column(name = "reply_date")
    private LocalDateTime replyDate;

    public static AskReplyEntity toEntity(AskReplyDTO askReplyDTO, AskBoardEntity askBoardEntity) {
        return AskReplyEntity.builder()
                .replyNum(askReplyDTO.getReplyNum())
                .askBoard(askBoardEntity)
                .askTitle(askReplyDTO.getAskTitle())
                .replyContent(askReplyDTO.getReplyContent())
                .replyDate(askReplyDTO.getReplyDate())
                .build();
    }
}
