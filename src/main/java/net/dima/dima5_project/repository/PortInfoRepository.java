package net.dima.dima5_project.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import net.dima.dima5_project.entity.PortInfoEntity;

@Repository
public interface PortInfoRepository extends JpaRepository<PortInfoEntity, String> {

     // PK로 조회 (기본 findById()와 동일하지만 필요 시 유지)
    PortInfoEntity findByPortId(String portId);

    boolean existsByPortId(String portId);

    // 모든 PortInfoEntity를 PortNameEntity와 함께 조회 (N+1 방지)
    @Query("""
        select p from PortInfoEntity p
        left join fetch p.portName
        """)
    List<PortInfoEntity> findAllWithName();

    // 특정 portId의 PortInfoEntity + PortNameEntity 조회
    @Query("""
        select p from PortInfoEntity p
        left join fetch p.portName
        where p.portId = :portId
        """)
    Optional<PortInfoEntity> findOneWithName(@Param("portId") String portId);

    // 한국어 이름 검색
    @Query("""
        select p from PortInfoEntity p
        join fetch p.portName n
        where lower(n.portNameKr) like lower(concat('%', :q, '%'))
        """)
    List<PortInfoEntity> searchByKoreanName(@Param("q") String q);

    // 다중 portId 조회
    List<PortInfoEntity> findByPortIdIn(List<String> ids);
    
}