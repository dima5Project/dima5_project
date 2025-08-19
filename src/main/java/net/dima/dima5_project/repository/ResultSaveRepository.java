package net.dima.dima5_project.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import net.dima.dima5_project.entity.ResultSaveEntity;

public interface ResultSaveRepository extends JpaRepository<ResultSaveEntity, Long> {

    // userId 를 함께 로딩해서 N+1 방지 + 페이징 안전
    @EntityGraph(attributePaths = {"userId"})
    Page<ResultSaveEntity> findByUserId_UserId(String userId, Pageable pageable);

    boolean existsBySaveSeqAndUserId_UserId(Long saveSeq, String userId);
}
