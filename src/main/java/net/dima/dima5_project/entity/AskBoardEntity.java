package net.dima.dima5_project.entity;

import java.time.LocalDateTime;

import org.hibernate.annotations.CreationTimestamp;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import net.dima.dima5_project.dto.AskBoardDTO;

@Entity
@Table(name = "ask_board")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AskBoardEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ask_seq")
    private Long askSeq;

    @Column(name = "ask_type")
    private String askType;

    @Column(name = "ask_title")
    private String askTitle;

    @Column(name = "ask_content")
    private String askContent;

    @ManyToOne
    @JoinColumn(name = "ask_writer", referencedColumnName = "user_id")
    private PredictUserEntity writer;

    @CreationTimestamp
    @Column(name = "create_date", nullable = false, updatable = false)
    private LocalDateTime createDate;

    @Column(name = "original_filename")
    private String originalFilename;

    @Column(name = "saved_filename")
    private String savedFilename;

    @Column(name = "ask_pwd")
    private String askPwd;

    @Column(name = "reply_status")
    private Boolean replyStatus;

    // AskReply 1:1 역방향
    @OneToOne(mappedBy = "askBoard", cascade = CascadeType.ALL)
    private AskReplyEntity reply;

    public static AskBoardEntity toEntity(AskBoardDTO dto) {
        // ★ createDate가 null이면 아예 세팅하지 않아서 @Builder.Default가 유지되도록
        AskBoardEntityBuilder b = AskBoardEntity.builder()
                .askSeq(dto.getAskSeq())
                .askType(dto.getAskType())
                .askTitle(dto.getAskTitle())
                .askContent(dto.getAskContent())
                .writer(dto.getWriter())
                .originalFilename(dto.getOriginalFilename())
                .savedFilename(dto.getSavedFilename())
                .askPwd(dto.getAskPwd())
                .replyStatus(dto.getReplyStatus())
                .reply(dto.getReply());

        if (dto.getCreateDate() != null) {
            b.createDate(dto.getCreateDate());
        }
        return b.build();
    }
}
