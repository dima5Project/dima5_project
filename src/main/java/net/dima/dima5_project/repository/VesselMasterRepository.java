package net.dima.dima5_project.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import net.dima.dima5_project.entity.VesselMasterEntity;

public interface VesselMasterRepository extends JpaRepository<VesselMasterEntity, Integer> {
    
    Optional<VesselMasterEntity> findByVslImo(String vslImo);
    Optional<VesselMasterEntity> findByVslMmsi(String vslMmsi);

}
