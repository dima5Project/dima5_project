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
            DATE_FORMAT(join_date, '%Y-%m') AS ym,
            CONCAT(
              DATE_FORMAT(join_date, '%m월 '),
              CEIL( (DAY(join_date) + WEEKDAY(DATE_FORMAT(join_date, '%Y-%m-01'))) / 7 ),
              '주'
            ) AS month_week,
            COUNT(*) AS cnt
          FROM predict_user
          WHERE join_date >= :fromDate
          GROUP BY ym, month_week
          ORDER BY MIN(join_date)
      """, nativeQuery = true)
  List<Object[]> monthlyWeekSignupCounts(@Param("fromDate") LocalDateTime fromDate);
}
