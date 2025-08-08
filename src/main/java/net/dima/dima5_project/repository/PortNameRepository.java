package net.dima.dima5_project.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import net.dima.dima5_project.entity.PortNameEntity;

@Repository
public interface PortNameRepository extends JpaRepository<PortNameEntity, String> {
    List<PortNameEntity> findByCountryNameKr(String countryNameKr);

    List<PortNameEntity> findByCountryNameEn(String countryNameEn);

    // 국가명 중복 제거 후 전체 조회
    @Query("SELECT DISTINCT p.countryNameKr FROM PortNameEntity p")
    List<String> findDistinctCountryNames();

}
