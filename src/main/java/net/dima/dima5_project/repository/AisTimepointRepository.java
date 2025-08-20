// package net.dima.dima5_project.repository;

// import java.util.Optional;

// import org.springframework.data.jpa.repository.JpaRepository;
// import org.springframework.data.jpa.repository.Query;
// import org.springframework.data.repository.query.Param;

// // import net.dima.dima5_project.entity.AisTimepointEntity;

// public interface AisTimepointRepository extends
// JpaRepository<AisTimepointEntity, Integer>{

// // 각 항구별(port_id) + 해당 선박(vsl_id) 조합 중에서 timestamp가 최신인 행의 timepoint 값
// @Query(value = """
// SELECT timepoint
// FROM ais_timepoint
// WHERE vsl_id = :vslId
// ORDER BY timestamp DESC
// LIMIT 1
// """, nativeQuery = true)
// Optional<Integer> findLatestTimepointByVslId(@Param("vslId") String vslId);

// // 해당 timepoint 에 해당하는 위도, 경도, 코그, 헤딩 값 불러오기
// public interface LastestAisProjection {
// double getLat();
// double getLon();
// double getCog();
// double getHeading();
// Integer getTimepoint();
// }

// @Query(value = """
// SELECT lat, lon, cog, heading, timepoint
// FROM ais_timepoint
// WHERE vsl_id = :vslId
// ORDER BY timestamp DESC
// LIMIT 1
// """, nativeQuery = true)
// LastestAisProjection findLatestByVslId(@Param("vslId") String vslId);

// }
