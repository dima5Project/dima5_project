package net.dima.dima5_project.repository;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;

import net.dima.dima5_project.entity.AskBoardEntity;

public interface AskBoardRepository extends JpaRepository<AskBoardEntity, Long> {

    // 검색어를 이용한 조회
    List<AskBoardEntity> findByWriterContains(String searchWord, Sort by);

    List<AskBoardEntity> findByAskTitleContains(String searchWord, Sort by);

    List<AskBoardEntity> findByAskContentContains(String searchWord, Sort by);

    // 페이징을 위한
    Page<AskBoardEntity> findByWriterContains(String searchWord, PageRequest of);

    Page<AskBoardEntity> findByAskTitleContains(String searchWord, PageRequest of);

    Page<AskBoardEntity> findByAskContentContains(String searchWord, PageRequest of);

}
