package net.dima.dima5_project.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import net.dima.dima5_project.entity.PredictUserEntity;

public interface PredictUserRepository extends JpaRepository<PredictUserEntity, Long> {

  // 유형별 카운트 (String userType 기준)
  @Query("select u.userType, count(u) from PredictUserEntity u group by u.userType")
  List<Object[]> countByUserType();

  // // 월별 주차 가입자 수 (월요일 시작 기준)
  // @Query(value = """
  // SELECT
  // DATE_FORMAT(DATE_SUB(join_date, INTERVAL WEEKDAY(join_date) DAY), '%Y-%m-%d')
  // AS week_start,
  // COUNT(*) AS cnt
  // FROM predict_user
  // WHERE join_date >= :fromDate
  // GROUP BY week_start
  // ORDER BY week_start
  // """, nativeQuery = true)
  // List<Object[]> countWeeklySignups(@Param("fromDate") java.time.LocalDateTime
  // fromDate);

  // ✅ fromDate 이후 가입자 전체를 그대로 가져와서 서비스에서 주차로 그룹핑
  List<PredictUserEntity> findByJoinDateGreaterThanEqual(LocalDateTime fromDate);

  Optional<PredictUserEntity> findByUserId(String userId); // ← user_id로 조회
}
