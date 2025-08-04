package net.dima.dima5_project.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import net.dima.dima5_project.entity.PortDockingEntity;

@Repository
public interface PortDockingRepository extends JpaRepository<PortDockingEntity, Long> {
    // 가장 최근 데이터 1건을 timestamp 기준으로 조회
    Optional<PortDockingEntity> findTopByPortNameOrderByTimestampDesc(String portName);
}
