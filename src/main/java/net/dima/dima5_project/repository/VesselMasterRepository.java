package net.dima.dima5_project.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import net.dima.dima5_project.entity.VesselMasterEntity;

public interface VesselMasterRepository extends JpaRepository<VesselMasterEntity, Integer> {

    // vsl_imo로 vsl_id 조회
    @Query("SELECT v.vslId FROM VesselMasterEntity v WHERE v.vslImo = :imo")
    Optional<String> findVslIdByVslImo(@Param("imo") String imo);

    // vsl_mmsi로 vsl_id 조회
    @Query(value = "select vsl_id from vessel_master where vsl_mmsi = :mmsi limit 1", nativeQuery = true)
    Optional<String> findVslIdByVslMmsi(@Param("mmsi") String mmsi);

    // vsl_imo로 vsl_img 조회
    @Query("SELECT v.vslImg FROM VesselMasterEntity v WHERE v.vslImo = :imo")
    Optional<String> findVslImgByVslImo(@Param("imo") String imo);

    // vsl_mmsi로 vsl_img 조회
    @Query("SELECT v.vslImg FROM VesselMasterEntity v WHERE v.vslMmsi = :mmsi")
    Optional<String> findVslImgByVslMmsi(@Param("mmsi") String mmsi);

}

