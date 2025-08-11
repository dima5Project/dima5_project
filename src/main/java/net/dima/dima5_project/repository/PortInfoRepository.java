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

    // 재검토 해야 함 !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    PortInfoEntity findByPortId(String portId);

    boolean existsByPortId(String portId);

    // port_name 같이 가져오기(N+1 방지)
    @Query("""
        select p from PortInfoEntity p
        left join fetch p.portName
        """)
    List<PortInfoEntity> findAllWithName();

    @Query("""
        select p from PortInfoEntity p
        left join fetch p.portName
        where p.portId = :portId
        """)
    Optional<PortInfoEntity> findOneWithName(@Param("portId") String portId);

    // 이름으로 검색(한국어)
    @Query("""
        select p from PortInfoEntity p
        join fetch p.portName n
        where lower(n.portNameKr) like lower(concat('%', :q, '%'))
        """)
    List<PortInfoEntity> searchByKoreanName(@Param("q") String q);

    List<PortInfoEntity> findByPortIdIn(List<String> ids);
}