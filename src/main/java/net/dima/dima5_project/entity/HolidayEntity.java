package net.dima.dima5_project.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "port_holiday")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HolidayEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long holiday_seq;

    @Column(name = "holiday_day")
    private String holidayDate; // 예: 2025-08-07 (기준이 PK라고 가정)

    @Column(name = "holiday_name")
    private String holidayName; // 공휴일 이름 (예: 광복절)

    @Column(name = "country_name_kr")
    private String countryNameKr; // 국가명 (예: 한국, 일본 등)
}
