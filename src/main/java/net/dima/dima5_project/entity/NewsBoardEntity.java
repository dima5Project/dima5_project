package net.dima.dima5_project.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import net.dima.dima5_project.dto.NewsBoardDTO;

@Entity
@Table(name = "news_board")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NewsBoardEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "news_seq")
    private long newsSeq;

    @Column(name = "publisher")
    private String publisher;

    @Column(name = "news_title")
    private String newsTitle;

    @Column(name = "register_date")
    private LocalDateTime registerDate;

    @Column(name = "img_url")
    private String imgUrl;

    @Column(name = "news_url")
    private String newsUrl;

    public static NewsBoardEntity toEntity(NewsBoardDTO newsboardDTO) {
        return NewsBoardEntity.builder()
            .newsSeq(newsboardDTO.getNewsSeq())
            .publisher(newsboardDTO.getPublisher())
            .newsTitle(newsboardDTO.getNewsTitle())
            .registerDate(newsboardDTO.getRegisterDate())
            .imgUrl(newsboardDTO.getImgUrl())
            .newsUrl(newsboardDTO.getNewsUrl())
            .build();
    }
}
