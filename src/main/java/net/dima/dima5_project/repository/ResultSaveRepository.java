package net.dima.dima5_project.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import net.dima.dima5_project.entity.ResultSaveEntity;

public interface ResultSaveRepository extends JpaRepository<ResultSaveEntity, Long> {

    // userId가 PredictUserEntity(연관관계)인 경우
    Page<ResultSaveEntity> findByUserId_UserIdOrderBySaveSeqDesc(String userId, Pageable pageable);

}
