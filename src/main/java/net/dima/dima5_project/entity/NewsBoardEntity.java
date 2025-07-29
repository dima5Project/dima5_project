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
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "news_board")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NewsBoardEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "news_seq")
    private Integer newsSeq;

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
}
