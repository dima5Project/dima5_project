package net.dima.dima5_project.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import net.dima.dima5_project.entity.AdminNoticeEntity;

public interface AdminNoticeRepository extends JpaRepository<AdminNoticeEntity, Long> {
    @Query("select n from AdminNoticeEntity n order by n.id desc")
    List<AdminNoticeEntity> findRecent(Pageable pageable);

    // 특정 문의의 가장 최근 로그 한 건
    Optional<AdminNoticeEntity> findFirstByAskSeqOrderByIdDesc(Long askSeq);

    // (선택) 특정 타입 검색이 필요하면
    Optional<AdminNoticeEntity> findFirstByAskSeqAndEventTypeOrderByIdDesc(Long askSeq, String eventType);
}
