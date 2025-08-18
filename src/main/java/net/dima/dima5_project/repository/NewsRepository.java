package net.dima.dima5_project.repository;

import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.repository.JpaRepository;

import net.dima.dima5_project.entity.NewsBoardEntity;

public interface NewsRepository extends JpaRepository<NewsBoardEntity, Long> {

    // 뉴스 제목에 키워드가 포함된 검색 결과 + 페이징
    Page<NewsBoardEntity> findByNewsTitleContaining(String searchWord, PageRequest pageable);

    // 관리자 페이지에 들어갈 뉴스
    Page<NewsBoardEntity> findByNewsTitleContainingIgnoreCaseOrPublisherContainingIgnoreCase(
            String title, String publisher, Pageable pageable);
}
