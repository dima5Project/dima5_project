package net.dima.dima5_project.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import net.dima.dima5_project.entity.PortDockingEntity;

@Repository
public interface PortDockingRepository extends JpaRepository<PortDockingEntity, Long> {
    Optional<PortDockingEntity> findTopByPortIdOrderByTimeStampDesc(String portId);

    List<PortDockingEntity> findTop5ByPortIdOrderByTimeStampDesc(String portId); // 그래프용

}
