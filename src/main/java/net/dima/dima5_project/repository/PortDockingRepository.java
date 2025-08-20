package net.dima.dima5_project.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import net.dima.dima5_project.entity.PortDockingEntity;

@Repository
public interface PortDockingRepository extends JpaRepository<PortDockingEntity, Long> {
    Optional<PortDockingEntity> findTopByPortIdOrderByTimeStampDesc(String portId);

    List<PortDockingEntity> findTop5ByPortIdOrderByTimeStampDesc(String portId); // 그래프용

    // 현진
    // 🔹 모든 항구의 "최신 1건"만 가져오기 (MySQL 8 이상)
    @Query(value = """
            SELECT * FROM (
                SELECT t.*,
                       ROW_NUMBER() OVER (PARTITION BY t.port_id ORDER BY t.time_stamp DESC) AS rn
                FROM port_docking t
            ) x
            WHERE x.rn = 1
            """, nativeQuery = true)
    List<PortDockingEntity> findLatestForAllPorts();
    // 코드 추가
}
