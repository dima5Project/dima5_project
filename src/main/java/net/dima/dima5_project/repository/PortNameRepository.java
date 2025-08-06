package net.dima.dima5_project.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import net.dima.dima5_project.entity.PortNameEntity;

public interface PortNameRepository extends JpaRepository<PortNameEntity, String> {

    // 항구명(한글)만 리스트로 가져오기
    @Query("SELECT p.portNameKr FROM PortNameEntity p")
    List<String> findAllPortNamesKr();

    // 항구명(한글)으로 PortNameEntity 찾기
    Optional<PortNameEntity> findByPortNameKr(String portNameKr);

}
