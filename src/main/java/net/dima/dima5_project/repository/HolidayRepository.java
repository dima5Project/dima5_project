package net.dima.dima5_project.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import net.dima.dima5_project.entity.HolidayEntity;

public interface HolidayRepository extends JpaRepository<HolidayEntity, String> {

    // 특정 국가 + 날짜의 공휴일 조회
    Optional<HolidayEntity> findByCountryNameKrAndHolidayDate(String countryNameKr, String holidayDate);

    // 특정 국가의 모든 공휴일
    List<HolidayEntity> findByCountryNameKr(String countryNameKr);
}
