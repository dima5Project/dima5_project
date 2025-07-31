package net.dima.dima5_project.dto;

import java.time.LocalDateTime;

import org.springframework.web.multipart.MultipartFile;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import net.dima.dima5_project.entity.AskBoardEntity;
import net.dima.dima5_project.entity.AskReplyEntity;
import net.dima.dima5_project.entity.PredictUserEntity;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AskBoardDTO {
    private Long askSeq;
    private String askType;
    private String askTitle;
    private String askContent;
    private PredictUserEntity writer; // DB에서 Entity로 뽑아 쓰기용
    private LocalDateTime createDate;
    private String originalFilename;
    private String savedFilename;
    private Integer askPwd;
    private Boolean replyStatus;
    private AskReplyEntity reply;

    // 파일 첨부되었을 때를 위한 추가 작업
    private MultipartFile uploadFile;

    public static AskBoardDTO toDTO(AskBoardEntity askBoardEntity) {
        return AskBoardDTO.builder()
                .askSeq(askBoardEntity.getAskSeq())
                .askType(askBoardEntity.getAskType())
                .askTitle(askBoardEntity.getAskTitle())
                .askContent(askBoardEntity.getAskContent())
                .writer(askBoardEntity.getWriter())
                .createDate(askBoardEntity.getCreateDate())
                .originalFilename(askBoardEntity.getOriginalFilename())
                .savedFilename(askBoardEntity.getSavedFilename())
                .askPwd(askBoardEntity.getAskPwd())
                .replyStatus(askBoardEntity.getReplyStatus())
                .reply(askBoardEntity.getReply())
                .build();
    }

}
