package net.dima.dima5_project.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import net.dima.dima5_project.entity.PredictUserEntity;

public interface PredictUserRepository extends JpaRepository<PredictUserEntity, Long> {

  // 유형별 카운트 (String userType 기준)
  @Query("select u.userType, count(u) from PredictUserEntity u group by u.userType")
  List<Object[]> countByUserType();

  // 월별 주차 가입자 수 (월요일 시작 기준)
  @Query(value = """
          SELECT
              YEARWEEK(join_date, 1) AS week,   -- ISO 주차
              COUNT(*) AS cnt
          FROM predict_user
          WHERE join_date >= :fromDate
          GROUP BY YEARWEEK(join_date, 1)
          ORDER BY week
      """, nativeQuery = true)
  List<Object[]> countWeeklySignups(@Param("fromDate") LocalDateTime fromDate);
}
