package net.dima.dima5_project.repository;

import java.time.LocalDateTime;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import net.dima.dima5_project.entity.AskBoardEntity;

public interface AskBoardRepository extends JpaRepository<AskBoardEntity, Long> {

    // 제목 검색
    Page<AskBoardEntity> findByAskTitleContains(String word, Pageable pageable);

    // 작성자 ID 검색
    Page<AskBoardEntity> findByWriter_UserIdContains(String word, Pageable pageable);

    // 제목 OR 작성자 ID 검색
    Page<AskBoardEntity> findByAskTitleContainsOrWriter_UserIdContains(String titleWord, String userIdWord,
            Pageable pageable);

    // 로그인 사용자의 문의내역, 생성일 최신순
    Page<AskBoardEntity> findByWriter_UserIdOrderByCreateDateDesc(String userId, Pageable pageable);

    // 여기서 부턴 선택! ↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓

    // 답변 여부로 필터 (예: 미답변만)
    Page<AskBoardEntity> findByWriter_UserIdAndReplyStatus(String userId, Boolean replyStatus, Pageable pageable);

    // 날짜 범위 필터 (마이페이지 기간 선택용)
    Page<AskBoardEntity> findByWriter_UserIdAndCreateDateBetween(
            String userId, LocalDateTime start, LocalDateTime end, Pageable pageable);

    // 관리자/운영자용: 미답변 전체 조회
    Page<AskBoardEntity> findByReplyStatusFalse(Pageable pageable);

}
