package net.dima.dima5_project.entity;

import java.time.LocalDateTime;

import org.springframework.data.domain.Persistable;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.PostLoad;
import jakarta.persistence.PostPersist;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
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
public class AskReplyEntity implements Persistable<Long> {

    @Id
    @Column(name = "reply_num")
    private Long replyNum;

    @OneToOne
    @JoinColumn(name = "reply_num", referencedColumnName = "ask_seq", insertable = false, updatable = false)
    private AskBoardEntity askBoard;

    @Column(name = "ask_title")
    private String askTitle;

    @Column(name = "reply_content")
    private String replyContent;

    @Column(name = "reply_date")
    private LocalDateTime replyDate;

    // -------- Persistable 제어 포인트 --------
    @Transient
    private boolean _isNew = false;

    @Override
    public Long getId() {
        return replyNum;
    }

    @Override
    public boolean isNew() {
        return _isNew || replyNum == null;
    }

    @PostLoad
    @PostPersist
    void markNotNew() {
        this._isNew = false;
    }

    public static AskReplyEntity toEntity(AskReplyDTO askReplyDTO, AskBoardEntity askBoardEntity) {
        return AskReplyEntity.builder()
                .replyNum(askBoardEntity.getAskSeq()) // ★ FK = PK 직접 세팅
                .askBoard(askBoardEntity)
                .askTitle(askReplyDTO.getAskTitle())
                .replyContent(askReplyDTO.getReplyContent())
                .replyDate(askReplyDTO.getReplyDate())
                .build();
    }
}