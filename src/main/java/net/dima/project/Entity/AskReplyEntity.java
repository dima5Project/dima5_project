package net.dima.project.Entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.MapsId;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

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
    @MapsId // PK == FK
    @JoinColumn(name = "reply_num", referencedColumnName = "ask_seq")
    private AskBoardEntity askBoard;

    @Column(name = "ask_title")
    private String askTitle;

    @Column(name = "reply_content")
    private String replyContent;

    @Column(name = "reply_date")
    private LocalDateTime replyDate;
}
