package net.dima.dima5_project.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import net.dima.dima5_project.entity.PortPredictEntity;

public interface PortPredictRepository extends JpaRepository<PortPredictEntity, Long> {

    List<PortPredictEntity> findByLatAndLon(double lat, double lon);

}
