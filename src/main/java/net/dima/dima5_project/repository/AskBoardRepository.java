package net.dima.dima5_project.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import net.dima.dima5_project.entity.AskBoardEntity;

public interface AskBoardRepository extends JpaRepository<AskBoardEntity, Long> {

    // // 검색어를 이용한 조회
    // List<AskBoardEntity> findByWriterContains(String searchWord, Sort by);

    // List<AskBoardEntity> findByAskTitleContains(String searchWord, Sort by);

    // List<AskBoardEntity> findByAskContentContains(String searchWord, Sort by);

    // // 페이징을 위한
    // Page<AskBoardEntity> findByWriterContains(String searchWord, Pageable
    // pageable);

    // Page<AskBoardEntity> findByAskTitleContains(String searchWord, Pageable
    // pageable);

    // Page<AskBoardEntity> findByAskContentContains(String searchWord, Pageable
    // pageable);

    // // 전체(제목 OR 글쓴이)
    // Page<AskBoardEntity> findByAskTitleContainsOrWriterContains(String titleWord,
    // String writerWord,
    // Pageable pageable);

    // 제목 검색
    Page<AskBoardEntity> findByAskTitleContains(String word, Pageable pageable);

    // 작성자 ID 검색
    Page<AskBoardEntity> findByWriter_UserIdContains(String word, Pageable pageable);

    // 제목 OR 작성자 ID 검색
    Page<AskBoardEntity> findByAskTitleContainsOrWriter_UserIdContains(String titleWord, String userIdWord,
            Pageable pageable);
}
