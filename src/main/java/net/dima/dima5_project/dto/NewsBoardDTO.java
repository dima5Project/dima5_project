package net.dima.dima5_project.dto;

import java.time.LocalDateTime;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class NewsBoardDTO {
    private Integer newsSeq;
    private String publisher;
    private String newsTitle;
    private LocalDateTime registerDate;
    private String imgUrl;
    private String newsUrl;

    // public static NewsBoardDTO toDTO(NewsBoardEntity newsBoardEntity) {
    // return NewsBoardDTO.builder()
    // .newsSeq(newsBoardEntity.getNewsSeq())
    // .publisher(newsBoardEntity.getPublisher())
    // .newsTitle(newsBoardEntity.getNewsTitle())
    // .registerDate(newsBoardEntity.getRegisterDate())
    // .imgUrl(newsBoardEntity.getImgUrl())
    // .newsUrl(newsBoardEntity.getNewsUrl())
    // .build();
    // }
}
