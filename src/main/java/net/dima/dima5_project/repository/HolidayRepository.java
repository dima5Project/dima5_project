package net.dima.dima5_project.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import net.dima.dima5_project.entity.HolidayEntity;

public interface HolidayRepository extends JpaRepository<HolidayEntity, String> {

    List<HolidayEntity> findByCountry(String country);

    List<HolidayEntity> findByDate(String date);
}
